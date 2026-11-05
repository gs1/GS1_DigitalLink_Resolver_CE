import os
import unittest
from unittest import mock

import psycopg

import web_db_postgres as db


class PostgresDbTest(unittest.TestCase):
    """Unit tests of the PostgreSQL backend: the connection pool is replaced by a mock."""

    def setUp(self):
        self.pool = mock.MagicMock()
        self.conn = self.pool.connection.return_value.__enter__.return_value
        patcher = mock.patch.object(db, 'get_pool', return_value=self.pool)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_read_converts_the_external_id(self):
        self.conn.execute.return_value.fetchone.return_value = ({'_id': '01_09506000134352'},)
        response = db.read_document('/01/09506000134352')
        self.assertEqual({'response_status': 200, 'data': {'_id': '01_09506000134352'}}, response)
        self.assertEqual(('01_09506000134352',), self.conn.execute.call_args.args[1])

    def test_read_not_found(self):
        self.conn.execute.return_value.fetchone.return_value = None
        response = db.read_document('/01/09506000134352')
        self.assertEqual(404, response['response_status'])
        self.assertIn('01_09506000134352', response['error'])

    def test_read_database_error(self):
        self.conn.execute.side_effect = psycopg.OperationalError('connection lost')
        response = db.read_document('/01/09506000134352')
        self.assertEqual(500, response['response_status'])
        self.assertIn('connection lost', response['error'])


@unittest.skipUnless(os.getenv('TEST_DATABASE_URL'),
                     'set TEST_DATABASE_URL to a throwaway PostgreSQL database to run these tests')
class PostgresDbLiveTest(unittest.TestCase):
    """Reads documents written directly to a real database. Only the row 'unittest_01_1' is touched."""

    @classmethod
    def setUpClass(cls):
        import postgres_db_init
        cls.postgres_db_init = postgres_db_init
        with mock.patch.dict(os.environ, {'DATABASE_URL': os.environ['TEST_DATABASE_URL']}):
            postgres_db_init.init_postgres()

    @classmethod
    def tearDownClass(cls):
        cls.postgres_db_init.get_pool().close()

    def _set_row(self, document):
        with self.postgres_db_init.get_pool().connection() as conn:
            conn.execute("DELETE FROM gs1resolver WHERE id = 'unittest_01_1'")
            if document is not None:
                conn.execute("INSERT INTO gs1resolver (id, doc) VALUES ('unittest_01_1', %s)",
                             (psycopg.types.json.Json(document),))

    def tearDown(self):
        self._set_row(None)

    def test_read(self):
        document = {'_id': 'unittest_01_1', 'defaultLinktype': 'gs1:pip', 'data': [{'z': 1, 'a': 2}]}
        self._set_row(document)
        response = db.read_document('/unittest/01/1')
        self.assertEqual({'response_status': 200, 'data': document}, response)
        self.assertEqual(['z', 'a'], list(response['data']['data'][0]))

    def test_read_not_found(self):
        self.assertEqual(404, db.read_document('/unittest/01/1')['response_status'])


if __name__ == '__main__':
    unittest.main()
