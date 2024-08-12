import os

import rocksdb


conn = None
def get_conn():
    global conn
    if conn:
        return conn

    if not os.path.exists('db'):
        os.makedirs('db')
    conn = rocksdb.DB('db/zentra.db', rocksdb.Options(create_if_missing=True))
    return conn
