import importlib
import os
import unittest
from unittest import mock

import db_init


class BackendSelectionTest(unittest.TestCase):
    def setUp(self):
        self.addCleanup(self._reload_with_default_backend)

    @staticmethod
    def _reload_with_default_backend():
        with mock.patch.dict(os.environ):
            os.environ.pop('DB_BACKEND', None)
            importlib.reload(db_init)
            import data_entry_db
            importlib.reload(data_entry_db)

    @staticmethod
    def _load_facade(backend):
        with mock.patch.dict(os.environ):
            if backend is None:
                os.environ.pop('DB_BACKEND', None)
            else:
                os.environ['DB_BACKEND'] = backend
            importlib.reload(db_init)
            import data_entry_db
            return importlib.reload(data_entry_db)

    def test_mongo_is_the_default_backend(self):
        facade = self._load_facade(None)
        self.assertEqual('data_entry_db_mongo', facade.read_document.__module__)

    def test_mongo_backend(self):
        facade = self._load_facade('mongo')
        self.assertEqual('data_entry_db_mongo', facade.create_document.__module__)

    def test_postgres_backend(self):
        facade = self._load_facade('postgres')
        for name in facade.__all__:
            self.assertEqual('data_entry_db_postgres', getattr(facade, name).__module__, name)

    def test_backend_name_is_case_and_whitespace_insensitive(self):
        facade = self._load_facade(' Postgres ')
        self.assertEqual('data_entry_db_postgres', facade.read_index.__module__)

    def test_unsupported_backend_is_rejected(self):
        with self.assertRaisesRegex(RuntimeError, "Unsupported DB_BACKEND 'oracle'"):
            self._load_facade('oracle')

    def test_init_db_rejects_unsupported_backend(self):
        with mock.patch.object(db_init, 'DB_BACKEND', 'oracle'):
            with self.assertRaisesRegex(RuntimeError, "Unsupported DB_BACKEND 'oracle'"):
                db_init.init_db(mock.Mock())

    def test_init_db_requires_database_url_for_postgres(self):
        with mock.patch.object(db_init, 'DB_BACKEND', 'postgres'), mock.patch.dict(os.environ):
            os.environ.pop('DATABASE_URL', None)
            with self.assertRaisesRegex(RuntimeError, 'DATABASE_URL'):
                db_init.init_db(mock.Mock())

    def test_init_db_requires_mongo_uri_for_mongo(self):
        with mock.patch.object(db_init, 'DB_BACKEND', 'mongo'), mock.patch.dict(os.environ):
            os.environ.pop('MONGO_URI', None)
            with self.assertRaisesRegex(RuntimeError, 'MONGO_URI'):
                db_init.init_db(mock.Mock())


if __name__ == '__main__':
    unittest.main()
