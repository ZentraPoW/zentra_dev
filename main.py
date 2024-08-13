
import sys
import os
import json
import uuid
import time

import tornado.ioloop
import tornado.web

import database


class NewPostAPIHandler(tornado.web.RequestHandler):
    def get(self):
        self.post()

    def post(self):
        db = database.get_conn()
        
        # Parse the JSON body
        data = json.loads(self.request.body or '{}')
        title = data.get('title')
        content = data.get('content')
        author = data.get('author', 'Anonymous')  # Default to 'Anonymous' if no author provided

        # if not title or not content:
        #     self.set_status(400)
        #     self.finish({"error": "Title and content are required"})
        #     return

        post_id = uuid.uuid4().hex
        post = {
            "id": post_id,
            "title": title,
            "content": content,
            "author": author,
            "timestamp": time.time()
        }

        timeline_id = 'timeline-%s-%s' % (str(10**15 - int(time.time())).zfill(15), post_id)
        # Store the post in RocksDB
        db.put(('post-%s' % post_id).encode(), json.dumps(post).encode())
        db.put(timeline_id.encode(), post_id.encode())

        self.set_status(201)  # Created
        self.finish({"message": "Post created successfully", "id": 'post-%s' % post_id, "timeline_id": timeline_id})

class ReplyAPIHandler(tornado.web.RequestHandler):
    def post(self):
        data = json.loads(self.request.body or '{}')
        post_id = data.get('post_id')
        content = data.get('content')

        if not post_id or not content:
            self.set_status(400)
            self.write({"error": "Missing post ID or content"})
            return

        db = database.get_conn()
        post_data = db.get(('post-%s' % post_id).encode())

        if not post_data:
            self.set_status(404)
            self.write({"error": "Post not found"})
            return

        reply_id = str(uuid.uuid4().hex)
        reply = {
            "id": reply_id,
            "post_id": post_id,
            "content": content,
            "timestamp": int(time.time())
        }

        db.put(('reply-%s' % reply_id).encode(), json.dumps(reply).encode())

        # Update the post with the new reply
        post = json.loads(post_data.decode())
        if 'replies' not in post:
            post['replies'] = []
        post['replies'].append(reply_id)
        db.put(('post-%s' % post_id).encode(), json.dumps(post).encode())

        self.set_header("Content-Type", "application/json")
        self.write(json.dumps({"success": True, "reply_id": reply_id}))

class ListPostsAPIHandler(tornado.web.RequestHandler):
    def get(self):
        db = database.get_conn()
        posts = []

        # Get pagination parameters
        from_timestamp = int(self.get_argument('from_timestamp', 0))
        limit = int(self.get_argument('limit', 10))

        # Iterate through keys in the database
        it = db.iteritems()
        if from_timestamp:
            it.seek(('timeline-%s-' % from_timestamp).encode())
        else:
            it.seek(b'timeline-')

        count = 0
        last_key = None
        for key, value in it:
            if not key.startswith(b'timeline-'):
                break
            
            post_id = value.decode()
            post_data = db.get(('post-%s' % post_id).encode())
            if post_data:
                post = json.loads(post_data.decode())
                posts.append(post)
            
            count += 1
            last_key = key
            if count >= limit:
                break

        # Sort posts by timestamp, newest first
        posts.sort(key=lambda x: x['timestamp'], reverse=True)

        # Prepare pagination metadata
        next_from_post = last_key.decode().split('-')[1] if last_key else None
        
        response = {
            "posts": posts,
            "pagination": {
                "limit": limit,
                "next_from_post": next_from_post
            }
        }

        self.set_header("Content-Type", "application/json")
        self.write(json.dumps(response))

class PostAPIHandler(tornado.web.RequestHandler):
    def get(self):
        post_id = self.get_argument('id', None)
        if not post_id:
            self.set_status(400)
            self.write({"error": "Missing post ID"})
            return

        db = database.get_conn()
        post_data = db.get(('post-%s' % post_id).encode())

        if not post_data:
            self.set_status(404)
            self.write({"error": "Post not found"})
            return

        post = json.loads(post_data.decode())

        # Get reply ids from the post data
        reply_ids = post.get('replies', [])

        # Fetch replies for the post
        replies = []
        for reply_id in reply_ids:
            reply_data = db.get(('reply-%s' % reply_id).encode())
            if reply_data:
                reply = json.loads(reply_data.decode())
                replies.append(reply)

        # Add replies to the post data
        post['replies'] = replies

        self.set_header("Content-Type", "application/json")
        self.write(json.dumps(post))

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("static/index.html")

class PostHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("static/post.html")

if __name__ == "__main__":
    app = tornado.web.Application([
        (r"/", MainHandler),
        (r"/post", PostHandler),

        (r"/api/new", NewPostAPIHandler),
        (r"/api/reply", ReplyAPIHandler),
        (r"/api/list", ListPostsAPIHandler),
        (r"/api/post", PostAPIHandler),
        (r"/static/(.*)", tornado.web.StaticFileHandler, {"path": os.path.join(os.path.dirname(__file__), "static")}),
    ], debug=True)  # Enable debug mode for auto-reload
    app.listen(8888)

    # print("Auto-reload is enabled. The server will restart automatically when code changes are detected.")
    # tornado.autoreload.start()  # Start the auto-reload mechanism
    print("Server is running on http://localhost:8888")
    tornado.ioloop.IOLoop.current().start()
