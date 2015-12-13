
import 'babel-polyfill'

import assert from 'assert'
import { types, validate, enforce } from '../src/index'

var emailType = types.custom({
  validate: (str) => /.@./.test(str),
  makeErrorMessage: (ctx, str) => `Error ${ctx.prop}: '${str}' doesn't really look like an email, dude`
})

var Author = {
  name: types.string.isRequired,
  email: emailType.isRequired,
  bookIds: types.arrayOf(types.string)
}

var Book = {
  id: types.string.isRequired,
  author: types.shape(Author).isRequired
}

describe('examples', () => {
  
  describe ('Author schema', () => {

    it ('should pass with valid author', () => {
      var author = {
        name: 'Bob Cobb',
        email: 'bob@cobb.com',
        bookIds: []
      }
      assert(!validate(Author, author))
    })

    it ('should fail when missing required prop', () => {
      var author = {
        name: 'Bob Cobb',
        bookIds: []
      }
      assert.equal(validate(Author, author).length, 1)
    })
  })

  describe ('Book schema', () => {

    it ('should pass with valid book', () => {
      var book = {
        id: '123',
        author: {
          name: 'Bob Cobb',
          email: 'bob@cobb.com'
        }
      }
      assert(!validate(Book, book))
    })

    it ('should fail when missing required prop', () => {
      var author = {
        name: 'Bob Cobb',
        bookIds: [ ]
      }
      assert.equal(validate(Author, author).length, 1)
    })
  })
})
