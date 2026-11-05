import os
import unittest
from unittest import mock

import psycopg

import data_entry_db_postgres as db


class PostgresDbTest(unittest.TestCase):
    """Unit tests of the PostgreSQL backend: the connection pool is replaced by a mock."""

    def setUp(self):
        self.pool = mock.MagicMock()
        self.conn = self.pool.connection.return_value.__enter__.return_value
        self.result = self.conn.execute.return_value
        patcher = mock.patch.object(db, 'get_pool', return_value=self.pool)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_create_requires_an_id(self):
        response = db.create_document({'data': []})
        self.assertEqual(400, response['response_status'])
        self.conn.execute.assert_not_called()

    def test_create(self):
        self.result.rowcount = 1
        document = {'_id': '01_09506000134352', 'data': [{'b': 1, 'a': 2}]}
        response = db.create_document(document)
        self.assertEqual(201, response['response_status'])
        sql, params = self.conn.execute.call_args.args
        self.assertIn('INSERT INTO gs1resolver', sql)
        self.assertEqual('01_09506000134352', params[0])
        self.assertEqual(document, params[1].obj)

    def test_create_existing_document_is_a_conflict(self):
        self.result.rowcount = 0
        response = db.create_document({'_id': '01_09506000134352'})
        self.assertEqual(409, response['response_status'])
        self.assertIn('01_09506000134352', response['error'])

    def test_create_invalid_data(self):
        self.conn.execute.side_effect = psycopg.errors.DataError('bad value')
        self.assertEqual(400, db.create_document({'_id': 'x'})['response_status'])

    def test_create_database_error(self):
        self.conn.execute.side_effect = psycopg.OperationalError('connection lost')
        response = db.create_document({'_id': 'x'})
        self.assertEqual(500, response['response_status'])
        self.assertIn('connection lost', response['error'])

    def test_read_converts_the_external_id(self):
        self.result.fetchone.return_value = ({'_id': '01_09506000134352'},)
        response = db.read_document('/01/09506000134352')
        self.assertEqual({'response_status': 200, 'data': {'_id': '01_09506000134352'}}, response)
        self.assertEqual(('01_09506000134352',), self.conn.execute.call_args.args[1])

    def test_read_not_found(self):
        self.result.fetchone.return_value = None
        response = db.read_document('01_09506000134352')
        self.assertEqual(404, response['response_status'])
        self.assertIn('/01/09506000134352', response['error'])

    def test_read_database_error(self):
        self.conn.execute.side_effect = psycopg.OperationalError('connection lost')
        self.assertEqual(500, db.read_document('01_1')['response_status'])

    def test_read_index(self):
        self.conn.execute.return_value = [('01_1',), ('8004_2',)]
        self.assertEqual({'response_status': 200, 'data': ['01_1', '8004_2']}, db.read_index())

    def test_read_index_empty(self):
        self.conn.execute.return_value = []
        self.assertEqual(404, db.read_index()['response_status'])

    def test_read_index_database_error(self):
        self.conn.execute.side_effect = psycopg.OperationalError('connection lost')
        self.assertEqual(500, db.read_index()['response_status'])

    def test_update(self):
        self.result.rowcount = 1
        document = {'_id': '01_1', 'data': []}
        self.assertEqual(200, db.update_document(document)['response_status'])
        params = self.conn.execute.call_args.args[1]
        self.assertEqual(document, params[0].obj)
        self.assertEqual('01_1', params[1])

    def test_update_not_found(self):
        self.result.rowcount = 0
        self.assertEqual(404, db.update_document({'_id': '01_1'})['response_status'])

    def test_update_database_error(self):
        self.conn.execute.side_effect = psycopg.OperationalError('connection lost')
        self.assertEqual(500, db.update_document({'_id': '01_1'})['response_status'])

    def test_delete_converts_the_external_id(self):
        self.result.rowcount = 1
        self.assertEqual(200, db.delete_document('/01/1')['response_status'])
        self.assertEqual(('01_1',), self.conn.execute.call_args.args[1])

    def test_delete_not_found(self):
        self.result.rowcount = 0
        self.assertEqual(404, db.delete_document('/01/1')['response_status'])

    def test_delete_database_error(self):
        self.conn.execute.side_effect = psycopg.OperationalError('connection lost')
        self.assertEqual(500, db.delete_document('/01/1')['response_status'])


@unittest.skipUnless(os.getenv('TEST_DATABASE_URL'),
                     'set TEST_DATABASE_URL to a throwaway PostgreSQL database to run these tests')
class PostgresDbLiveTest(unittest.TestCase):
    """Runs the PostgreSQL backend against a real database. Only rows with an id starting 'unittest_' are touched."""

    @classmethod
    def setUpClass(cls):
        import postgres_db_init
        cls.postgres_db_init = postgres_db_init
        with mock.patch.dict(os.environ, {'DATABASE_URL': os.environ['TEST_DATABASE_URL']}):
            postgres_db_init.init_postgres()
            # Starting the second server must not fail on the existing table
            postgres_db_init.init_postgres()

    @classmethod
    def tearDownClass(cls):
        cls.postgres_db_init.get_pool().close()

    def setUp(self):
        self.addCleanup(db.delete_document, 'unittest_01_1')

    def test_crud_cycle(self):
        document = {'_id': 'unittest_01_1', 'defaultLinktype': 'gs1:pip', 'data': [{'z': 1, 'a': 2, 'm': {'y': 1, 'b': 2}}]}
        self.assertEqual(201, db.create_document(document)['response_status'])
        self.assertEqual(409, db.create_document(document)['response_status'])

        # The external form of the id is accepted as well as the internal one
        self.assertEqual(document, db.read_document('/unittest/01/1')['data'])
        read = db.read_document('unittest_01_1')
        self.assertEqual(200, read['response_status'])
        self.assertEqual(document, read['data'])
        # The key order of the document is preserved
        self.assertEqual(['z', 'a', 'm'], list(read['data']['data'][0]))
        self.assertEqual(['y', 'b'], list(read['data']['data'][0]['m']))

        self.assertIn('unittest_01_1', db.read_index()['data'])

        document['defaultLinktype'] = 'gs1:certificationInfo'
        self.assertEqual(200, db.update_document(document)['response_status'])
        self.assertEqual('gs1:certificationInfo', db.read_document('unittest_01_1')['data']['defaultLinktype'])

        self.assertEqual(200, db.delete_document('unittest_01_1')['response_status'])
        self.assertEqual(404, db.read_document('unittest_01_1')['response_status'])
        self.assertEqual(404, db.delete_document('unittest_01_1')['response_status'])

    def test_update_missing_document(self):
        self.assertEqual(404, db.update_document({'_id': 'unittest_01_missing'})['response_status'])

    def test_non_ascii_and_nul_characters(self):
        document = {'_id': 'unittest_01_1', 'itemDescription': 'Crème brûlée \u0000 🍮'}
        self.assertEqual(201, db.create_document(document)['response_status'])
        self.assertEqual(document, db.read_document('unittest_01_1')['data'])


if __name__ == '__main__':
    unittest.main()
