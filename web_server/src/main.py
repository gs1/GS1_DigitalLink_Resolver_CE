import signal
import sys
from __init__ import create_app


def signal_handler(sig, frame):
    print('SIGINT or SIGTERM received. Preparing to exit...')
    # I will add any cleanup logic here, you can too!
    sys.exit(0)


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

app = create_app()

if __name__ == "__main__":
    print('Resolver Front-End Web Server starting on port 4000. send a SIGINT or SIGTERM signal to stop the server.')
    app.run(host='0.0.0.0', port=4000)