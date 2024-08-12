
import os

import tornado.ioloop
import tornado.web

import database


class APIHandler(tornado.web.RequestHandler):
    def post(self):
        self.finish({})


class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("static/index.html")


if __name__ == "__main__":
    app = tornado.web.Application([
        (r"/", MainHandler),
        (r"/static/(.*)", tornado.web.StaticFileHandler, {"path": os.path.join(os.path.dirname(__file__), "static")}),
    ])
    app.listen(8888)

    print("Server is running on http://localhost:8888")
    tornado.ioloop.IOLoop.current().start()
