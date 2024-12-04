from flask import Flask, request, jsonify, send_from_directory
import os
import httpx  # Removed requests import

app = Flask(__name__)
public_folder_path = os.path.join(os.getcwd(), 'public')


@app.route("/")
def serve_index():
    # Serve index.html when accessing the root URL
    return send_from_directory(public_folder_path, 'index.html')


@app.route("/<path:filename>")
def serve_file(filename):
    # Serve files from the 'public' directory
    return send_from_directory(public_folder_path, filename)


@app.route("/api", methods=["GET"])
def handle_request():
    query_string = request.query_string.decode()
    params = parse_query(query_string)
    result_obj = {}

    if 'test' in params:
        if params['test'] == 'getHTTPversion' and 'testVal' in params:
            version = get_http_version(params['testVal'])
            result_obj = {"test": params['test'], "testVal": params['testVal'], "result": version}
        elif params['test'] == 'getAllHeaders' and 'testVal' in params:
            headers_result = get_all_headers(params['testVal'])
            result_obj = {"test": params['test'], "testVal": params['testVal'], "result": headers_result}
    else:
        result_obj = {"error": "No command received"}

    return jsonify(result_obj)


def parse_query(query):
    pairs = query.split('&')
    result = {}
    for pair in pairs:
        if '=' in pair:
            name, value = pair.split('=')
            result[name] = url_decode(value)
    return result


def url_decode(value):
    from urllib.parse import unquote_plus
    return unquote_plus(value)


def get_http_version(domain):
    try:
        print('get_http_version() domain: ', domain)

        # Create an HTTP client capable of HTTP/2
        with httpx.Client(http2=True) as client:
            # Perform a HEAD request
            response = client.head(f"https://{domain}")

            # Access HTTP version from response
            version = response.http_version  # This will return 'HTTP/1.1' or 'HTTP/2'

        return version

    except Exception as e:
        return str(e)


def get_all_headers(uri):
    try:
        # Create an HTTP client capable of HTTP/2 and disable following redirects
        with httpx.Client(http2=True, follow_redirects=False) as client:
            # Perform a HEAD request
            response = client.head(uri)

            headers_info = {
                "httpCode": response.status_code,
                "httpMsg": response.reason_phrase,
                "requestURI": request.query_string.decode(),
                "Requesting_User_Agent": request.headers.get('User-Agent', ''),
                "Requesting_Accept_Header": request.headers.get('Accept', ''),
                "Requesting_Accept_Language": request.headers.get('Accept-Language', ''),
            }
            headers_info.update(response.headers)
            return headers_info
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=2000)