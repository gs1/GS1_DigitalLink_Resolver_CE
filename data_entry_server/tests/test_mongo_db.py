import unittest
from unittest import mock

from pymongo import errors

import data_entry_db_mongo as db


class MongoDbTest(unittest.TestCase):
    """Unit tests of the MongoDB backend: the collection is replaced by a mock."""

    def setUp(self):
        self.collection = mock.MagicMock()
        patcher = mock.patch.object(db, '_get_collection', return_value=self.collection)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_create_requires_an_id(self):
        self.assertEqual(400, db.create_document({})['response_status'])

    def test_create(self):
        self.collection.find_one.return_value = None
        self.collection.insert_one.return_value.inserted_id = '01_1'
        self.assertEqual(201, db.create_document({'_id': '01_1'})['response_status'])

    def test_create_existing_document_is_a_conflict(self):
        self.collection.find_one.return_value = {'_id': '01_1'}
        self.assertEqual(409, db.create_document({'_id': '01_1'})['response_status'])
        self.collection.insert_one.assert_not_called()

    def test_create_database_error(self):
        self.collection.find_one.side_effect = errors.PyMongoError('boom')
        self.assertEqual(500, db.create_document({'_id': '01_1'})['response_status'])

    def test_read_converts_the_external_id(self):
        self.collection.find_one.return_value = {'_id': '01_1'}
        self.assertEqual(200, db.read_document('/01/1')['response_status'])
        self.collection.find_one.assert_called_once_with({'_id': '01_1'})

    def test_read_not_found(self):
        self.collection.find_one.return_value = None
        response = db.read_document('01_1')
        self.assertEqual(404, response['response_status'])
        self.assertIn('/01/1', response['error'])

    def test_read_index(self):
        self.collection.find.return_value = [{'_id': '01_1'}, {'_id': '8004_2'}]
        self.assertEqual(['01_1', '8004_2'], db.read_index()['data'])

    def test_read_index_empty(self):
        self.collection.find.return_value = []
        self.assertEqual(404, db.read_index()['response_status'])

    def test_update(self):
        self.collection.replace_one.return_value.matched_count = 1
        self.assertEqual(200, db.update_document({'_id': '01_1'})['response_status'])

    def test_update_not_found(self):
        self.collection.replace_one.return_value.matched_count = 0
        self.assertEqual(404, db.update_document({'_id': '01_1'})['response_status'])

    def test_delete_converts_the_external_id(self):
        self.collection.delete_one.return_value.deleted_count = 1
        self.assertEqual(200, db.delete_document('/01/1')['response_status'])
        self.collection.delete_one.assert_called_once_with({'_id': '01_1'})

    def test_delete_not_found(self):
        self.collection.delete_one.return_value.deleted_count = 0
        self.assertEqual(404, db.delete_document('/01/1')['response_status'])


if __name__ == '__main__':
    unittest.main()
