import unittest
from unittest import mock

from pymongo import errors

import web_db_mongo as db


class MongoDbTest(unittest.TestCase):
    """Unit tests of the MongoDB backend: the collection is replaced by a mock."""

    def setUp(self):
        self.collection = mock.MagicMock()
        patcher = mock.patch.object(db, '_get_collection', return_value=self.collection)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_read_converts_the_external_id(self):
        self.collection.find_one.return_value = {'_id': '01_1'}
        self.assertEqual({'response_status': 200, 'data': {'_id': '01_1'}}, db.read_document('/01/1'))
        self.collection.find_one.assert_called_once_with({'_id': '01_1'})

    def test_read_not_found(self):
        self.collection.find_one.return_value = None
        self.assertEqual(404, db.read_document('/01/1')['response_status'])

    def test_read_database_error(self):
        self.collection.find_one.side_effect = errors.PyMongoError('boom')
        self.assertEqual(500, db.read_document('/01/1')['response_status'])


if __name__ == '__main__':
    unittest.main()
