const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const {Blog Post} = require('../models');
const { app, runServer, closeServer } = require("../server");
const {TEST_DATABASE_URL} = require('../config');

const expect = chai.expect;

chai.use(chaiHttp);

function seedBlogData() {
  console.info('seeding restaurant data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateBlogData());
  }
  // this will return a promise
  return BlogPost.insertMany(seedData);
}


function generateBlogData() {
  return {
    author: {
        firstName: faker.name.firstName(),
        lastName: faker.name.lastName()
      },
      title: faker.lorem.sentence(),
      content: faker.lorem.text()
    };
   }


function tearDownDb() {
   return new Promise((resolve, reject) => {
    console.warn('Deleting database');
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err));
	});
}

describe('Blog Post API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedRestaurantData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

describe('GET endpoint', function() {

    it('should return all existing posts', function() {
      let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body.blogPost).to.have.lengthOf.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          expect(res.body.blogPost).to.have.lengthOf(count);
        });
    });


    it('should return blog posts with right fields', function() {

      let resBlog;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.blogPost).to.be.a('array');
          expect(res.body.blogPost).to.have.lengthOf.at.least(1);

          res.body.blogPost.forEach(function(blogPost) {
            expect(blogPost).to.be.a('object');
            expect(blogPost).to.include.keys(
              'id', 'title', 'author', 'content', 'created');
          });
          resBlog = res.body.blogPost[0];
          return BlogPost.findById(resBlog.id);
        })
        .then(function(BlogPost) {
          expect(resBlog.title).to.equal(blogPost.title);
          expect(resBlog.author).to.equal(blogPost.author);
          expect(resBlog.content).to.equal(blogPost.content);
          
        });
    });
  });

  describe('POST endpoint', function() {
   
    it('should add a new blog post', function() {

      const newBlog = generateBlogData();
      
      return chai.request(app)
        .post('/posts')
        .send(newblog)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(blogPost).to.include.keys(
              'id', 'title', 'author', 'content', 'created');
          expect(res.body.title).to.equal(newBlog.title);
          expect(res.body.id).to.not.be.null;
          expect(res.body.content).to.equal(newblog.content);
          expect(res.body.author).to.equal(newBlog.author);
          return BlogPost.findById(res.body.id);
        })
        .then(function (post) {
          post.title.should.equal(newPost.title);
          post.content.should.equal(newPost.content);
          post.author.firstName.should.equal(newPost.author.firstName);
          post.author.lastName.should.equal(newPost.author.lastName);
		});
    });
  });

  describe('PUT endpoint', function() {

    it('should update fields you send over', function() {
      const updateData = {
        title: 'fofofofofofofof',
        content: 'futuristic fusion'
        author: {
          firstName: 'foo',
          lastName: 'bar'
		}
      };

      return BlogPost
        .findOne()
        .then(function(blogPost) {
          updateData.id = blogPost.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/posts/${blogPost.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);

          return BlogPost.findById(updateData.id);
        })
        .then(post => {
          post.title.should.equal(updateData.title);
          post.content.should.equal(updateData.content);
          post.author.firstName.should.equal(updateData.author.firstName);
          post.author.lastName.should.equal(updateData.author.lastName);
		});
    });
  });

  describe('DELETE endpoint', function() {
    it('delete a blog post by id', function() {

      let blogPost;

      return blogPost
        .findOne()
        .then(function(_blogPost) {
          blogPost = _blogPost;
          return chai.request(app).delete(`/posts/${blogPost.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(blogPost.id);
        })
        .then(function(_blogPost) {
          expect(_blogPost).to.be.null;
        });
    });
  });
});
