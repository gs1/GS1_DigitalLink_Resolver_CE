##########################################################
# Python Accounts Administration Application
# v1.1 by Nick Lansley for Python v3.6 and later
##########################################################
# Before first use, use 'pip' to install these libraries:
# > pip install requests
# > pip install dotmap
# Then, update your certificates library:
# > pip install --upgrade certifi
#
# Usage: Change to same directory as script, then:
# > python accounts.py
##########################################################

import json
import requests
from dotmap import DotMap
import urllib3

check_ssl_certs_flag = False

if not check_ssl_certs_flag:
    urllib3.disable_warnings()

domain = 'resolver-dv1.gs1.org'  # change when you host your Resolver on a given domain
api_token = 'MyAdminAuthKey' # this is set in environment variable 'ADMIN_AUTH_KEY' in resolver_data_entry_server/Dockerfile
accounts_list = []
api_url = 'https://' + domain + '/admin/accounts'
headers = {'Content-Type': 'application/json',
           'Authorization': 'Bearer {0}'.format(api_token)}


def show_ssl_error_message():
    print("Your local SSL certificate store is not up to date and cannot decrypt incoming Resolver API responses.")
    print("To fix, exit this program and run this command:")
    print("pip install --upgrade certifi")


def save_account(account_name, issuer_gln, authentication_key):
    global api_url, check_ssl_certs_flag
    body = [{
        'issuerGLN': issuer_gln,
        'accountName': account_name,
        'authenticationKey': authentication_key
    }]
    try:
        response = requests.post(api_url, data=json.dumps(body), headers=headers, verify=check_ssl_certs_flag)
        return True
    except requests.exceptions.SSLError:
        show_ssl_error_message()
        return False


def remove_account(account_name, issuer_gln, authentication_key):
    global api_url, check_ssl_certs_flag
    body = [{
        'issuerGLN': issuer_gln,
        'accountName': account_name,
        'authenticationKey': authentication_key
    }]

    print('-------------------------------------')
    print('Account Name:', account_name)
    print('Issuer GLN:  ', issuer_gln)
    print('Auth Key:    ', authentication_key)
    print('-------------------------------------')

    yn = input('Delete this account - are you sure (Y/N)?: ').upper()
    if yn == 'Y':
        try:
            response = requests.delete(api_url, data=json.dumps(body), headers=headers, verify=check_ssl_certs_flag)
            print('Account deleted')
        except requests.exceptions.SSLError:
            show_ssl_error_message()
            print("Account NOT deleted")

    else:
        print('Account deletion abandoned')


def create_account():
    account_name = input('Please enter a name for this account: ')
    if account_name == '':
        print('(Abandoned)')
        return
    else:
        account_name = account_name.strip()

    if len(account_name) > 100:
        account_name = input('Please keep the account under 100 char: ')

    issuer_gln = input('13-digit Issuer GLN: ')
    if issuer_gln == '':
        print('(Abandoned)')
        return
    else:
        issuer_gln = issuer_gln.strip()

    while len(str(issuer_gln)) != 13 or not issuer_gln.isnumeric():
        issuer_gln = input('Issuer GLN needs to be a 13 digit number: ')

    authentication_key = input('Authentication key (up to 64 chars): ')
    if authentication_key == '':
        print('(Abandoned)')
        return
    while len(authentication_key) > 64:
        authentication_key = input('Keep Authentication key under 64 chars: ')

    print('-------------------------------------')
    print('Account Name:', '[' + account_name + ']')
    print('Issuer GLN:  ', '[' + issuer_gln + ']')
    print('Auth Key:    ', '[' + authentication_key + ']')
    print('-------------------------------------')
    yn = input('Details OK (Y/N)?: ').upper()
    if yn == 'Y':
        if save_account(account_name, issuer_gln, authentication_key):
            print('Account created')
        else:
            print("Account NOT created due to error")
    else:
        print('Account creation cancelled')


def update_account():
    print('------------------------------------------------------------------------------')
    print('To update an account, first delete it then recreate it.')
    print('Deleting an account does not affect any Resolver data uploaded by that account')
    print('and you can reconnect an account to its entries by using the same Issuer GLN.')
    print('The same Issuer GLN value can be shared by more than one account.')
    print('------------------------------------------------------------------------------')


def delete_account():
    list_accounts()
    account_num = 'x'
    while not account_num.isnumeric():
        account_num = input('Which account number would you wish to delete (0 to cancel)? ')
    account_id = int(account_num) - 1
    if account_id < 0:
        return
    account = DotMap(accounts_list['data'][account_id])
    remove_account(account.accountName, account.issuerGLN, account.authenticationKey)


def list_accounts():
    global api_url, check_ssl_certs_flag, accounts_list
    try:
        response = requests.get(api_url, headers=headers, verify=check_ssl_certs_flag)

        if response.status_code == 200:
            accounts_list = json.loads(response.content.decode('utf-8'))
            longest_issuer_gln = 0
            longest_account_name = 0
            longest_auth_key = 0
            for account in accounts_list['data']:
                for key, value in account.items():
                    if key == 'issuerGLN' and len(value) > longest_issuer_gln:
                        longest_issuer_gln = len(value)
                    elif key == 'accountName' and len(value) > longest_account_name:
                        longest_account_name = len(value)
                    elif key == 'authenticationKey' and len(value) > longest_auth_key:
                        longest_auth_key = len(value)
            print()
            print('Accounts on Resolver', domain)
            print('  # | IssuerGLN' + (' ' * (longest_issuer_gln - 9)) +
                  ' | Account Name' + (' ' * (longest_account_name - 12)) +
                  ' | Auth Key' + (' ' * (longest_auth_key - 8)))
            print(('-' * (longest_issuer_gln + longest_account_name + longest_auth_key)))
        else:
            print('HTTP {0} received'.format(response.status_code))
            return None

        account_number = 1
        for account in accounts_list['data']:
            account_line = '{:3.0f}'.format(account_number) + ' '
            for key, value in account.items():
                if key == 'issuerGLN':
                    account_line += '| ' + value + (' ' * (longest_issuer_gln - len(value) + 1))
                if key == 'accountName':
                    account_line += '| ' + value + (' ' * (longest_account_name - len(value) + 1))
                if key == 'authenticationKey':
                    account_line += '| ' + value + (' ' * (longest_auth_key - len(value) + 1))
            print(account_line)
            account_number += 1

    except requests.exceptions.SSLError:
        show_ssl_error_message()



def display_main_menu():
    global domain, check_ssl_certs_flag
    print('')
    print('The current Resolver is:', domain)
    print('-------------------------' + ('-' * (len(domain))))

    if not check_ssl_certs_flag:
        print("-----------------------------------------------------------------")
        print("Warning, SSL certificates will not be checked when accessing data")
        print("-----------------------------------------------------------------")

    print('Main Menu')
    print('')
    print('1 - List Accounts on this Resolver')
    print('2 - Add a new Account')
    print('3 - Edit an existing Account')
    print('4 - Delete an Account')
    if check_ssl_certs_flag:
        print("5 - Disable SSL certificates check")
    else:
        print("5 - Enable SSL certificates check")
    print('6 - Exit')
    print('-------------------------------------')


def main():
    global check_ssl_certs_flag
    print()
    print('GS1 Resolver Accounts Administration')
    while True:
        display_main_menu()
        choice = input('Please choose a menu option (1 to 6): ')
        if choice == '1':
            list_accounts()
        elif choice == '2':
            create_account()
        elif choice == '3':
            update_account()
        elif choice == '4':
            delete_account()
        elif choice == '5':
            check_ssl_certs_flag = not check_ssl_certs_flag
        elif choice == '6':
            print('Exiting program')
            exit()
        else:
            print('Unknown menu option ' + choice)


if __name__ == '__main__':
    main()
