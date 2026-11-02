import unittest

from web_db_ids import reformat_id_for_db


class DocumentIdTest(unittest.TestCase):
    def test_external_to_internal(self):
        self.assertEqual('01_05392000229648', reformat_id_for_db('/01/05392000229648'))

    def test_internal_to_internal_is_unchanged(self):
        self.assertEqual('01_05392000229648', reformat_id_for_db('01_05392000229648'))

    def test_qualifiers(self):
        self.assertEqual('01_05392000229648_10_LOT1', reformat_id_for_db('/01/05392000229648/10/LOT1'))


if __name__ == '__main__':
    unittest.main()
