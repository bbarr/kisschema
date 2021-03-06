
import 'babel-polyfill'

import assert from 'assert'
import { types, validate, enforce } from '../src/index'

var describeBasicType = (typeName, type, passingValue, failingValue) => {

  it ('should have isRequired option', () => {
    assert(type.isRequired)
  })

  describe('.validate', () => {

    it ('should return true if passed', () => {
      assert.equal(type.validate(passingValue), true)
    })

    it ('should return false if failed', () => {
      assert.equal(type.validate(failingValue), false)
    })
  })

  describe('.makeErrorMessage', () => {

    it ('should return a helpful message', () => {
      assert.equal(
        type.makeErrorMessage({ prop: 'test-prop' }),
        `test-prop should be of type: ${typeName}`
      )
    })
  })

  describe('serialization', () => {

    it ('should JSON.stringify nicely', () => {
      assert.equal(JSON.stringify(type), JSON.stringify({ type: typeName }))
    })

    it ('should JSON.stringify nicely with isRequired', () => {
      assert.equal(JSON.stringify(type.isRequired), JSON.stringify({
        required: true,
        type: typeName
      }))
    })
  })
}

describe('kisschema', () => {

  describe('kisschema types', () => {

    describe('kisschema.types.string', () => {
      describeBasicType('string', types.string, '', 1)
    })

    describe('kisschema.types.number', () => {
      describeBasicType('number', types.number, 1, '')
    })

    describe('kisschema.types.bool', () => {
      describeBasicType('bool', types.bool, true, 1)
    })

    describe('kisschema.types.object', () => {
      describeBasicType('object', types.object, {}, 1)
    })

    describe('kisschema.types.array', () => {
      describeBasicType('array', types.array, [], 1)
    })

    describe('kisschema.types.func', () => {
      describeBasicType('func', types.func, function() {}, 1)
    })

    describe('kisschema.types.oneOf', () => {

      it ('should have isRequired option', () => {
        assert(types.oneOf().isRequired)
      })

      it ('should return true if test value is one that was given to oneOf()', () => {
        var type = types.oneOf([ 'a', 'b', 'c' ])
        assert.equal(type.validate('a'), true)
      })

      it ('should return false if test value is not one that was given to oneOf()', () => {
        var type = types.oneOf([ 'a', 'b', 'c' ])
        assert.equal(type.validate('d'), false)
      })

      it ('should offer a helpful error message', () => {
        var possibilities = [ 'a', 'b', 'c' ]
        var type = types.oneOf(possibilities)
        assert.deepEqual(
          type.makeErrorMessage({ prop: 'test-prop' }),
          { oneOf: ['a','b','c'] }
        )
      })
    })

    describe('kisschema.types.oneOfType', () => {

      it ('should have isRequired option', () => {
        assert(types.oneOfType().isRequired)
      })

      it ('should return true if test value matches any of the given types', () => {
        var type = types.oneOfType([
          types.string,
          types.number
        ])
        assert.equal(type.validate('a'), true)
        assert.equal(type.validate(3), true)
      })

      it ('should return false if test value matches any of the given schemas', () => {
        var type = types.oneOfType([ 
          types.shape({ a: types.string }),
          types.number
        ])
        assert.equal(type.validate({ a: '1' }), true)
        assert.equal(type.validate(1), true)
      })

      it ('should offer a helpful error message', () => {
        var possibilities = [ 
          types.shape({ a: types.string.isRequired }),
          types.number
        ]
        var type = types.oneOfType(possibilities)
        assert.deepEqual(
          type.makeErrorMessage({ prop: 'test-prop' }),
          { oneOfType: [ { a: { required: true, type: 'string' } }, { type: 'number' } ] }
        )
      })
    })

    describe('kisschema.types.arrayOf', () => {

      it ('should have isRequired option', () => {
        assert(types.arrayOf().isRequired)
      })

      it ('should return true if test value matches any of the given types', () => {
        var type = types.arrayOf({ a: types.number })
        assert.equal(type.validate([ { a: 1 } ]), true)
      })

      it ('should return false if test value matches any of the given schemas', () => {
        var type = types.arrayOf({ a: types.number }) 
        assert.equal(type.validate([ { a: '1' } ]), false)
      })

      it ('should offer a helpful error message', () => {
        var item = types.shape({ a: types.number })
        var type = types.arrayOf(item) 
        assert.deepEqual(
          type.makeErrorMessage({ prop: 'test-prop' }),
          { arrayOf: { a: { type: 'number' } } }
        )
      })
    })

    describe('kisschema.types.objectOf', () => {

      it ('should have isRequired option', () => {
        assert(types.objectOf().isRequired)
      })

      it ('should return true if test value matches any of the given types', () => {
        var type = types.objectOf(types.number)
        assert.equal(type.validate({ a: 1 }), true)
      })

      it ('should return false if test value matches any of the given schemas', () => {
        var type = types.objectOf(types.number) 
        assert.equal(type.validate({ a: '1' }), false)
      })

      it ('should offer a helpful error message', () => {
        var type = types.objectOf(types.number) 
        assert.deepEqual(
          type.makeErrorMessage({ prop: 'test-prop' }),
          { objectOf: { type: 'number' } }
        )
      })
    })

    describe('kisschema.types.instanceOf', () => {

      it ('should have isRequired option', () => {
        assert(types.instanceOf().isRequired)
      })

      it ('should return true if instance of the given constructor', () => {
        var Animal = function() {}
        var type = types.instanceOf(Animal)
        assert.equal(type.validate(new Animal), true)
      })

      it ('should return false if not instance of the given constructor', () => {
        var Animal = function() {}
        var type = types.instanceOf(Animal)
        assert.equal(type.validate({}), false)
      })

      it ('should offer a helpful error message', () => {
        var Animal = function() {}
        var type = types.instanceOf(Animal)
        assert.equal(
          type.makeErrorMessage({ prop: 'test-prop' }),
          `test-prop should be an instance of ${Animal.toString()}`
        )
      })
    })

    describe('kisschema.types.shape', () => {

      it ('should have isRequired option', () => {
        assert(types.shape({
          a: types.string,
          b: types.array
        }).isRequired)
      })

      it ('should return true if shape/schema is satisfied', () => {

        var type = types.shape({
          a: types.string,
          b: types.array
        })

        assert.equal(type.validate({ a: '', b: [] }), true)
      })

      it ('should return false if shape/schema is not satisfied', () => {
        var type = types.shape({
          a: types.string,
          b: types.array
        })

        assert.equal(type.validate({ a: '', b: 3 }), false)
      })

      it ('should offer a helpful error message', () => {
        var schema = {
          a: types.string,
          b: types.array
        }
        var type = types.shape(schema)

        assert.deepEqual(
          type.makeErrorMessage({ prop: 'test-prop' }, { a: 1, b: '1' }), 
          { a: 'a should be of type: string', b: 'b should be of type: array' }
        )
      })

      it ('should work on nested shapes', () => {

        var type = types.shape({
          a: types.shape({
            b: types.number.isRequired
          })
        })

        assert.deepEqual(
          type.toJSON(), 
          { a: { b: { required: true, type: 'number' } } }
        )
      })
    })

    describe('kisschema.types.any', () => {

      it ('should have isRequired option', () => {
        assert(types.any.isRequired)
      })

      it ('should return true if given existy', () => {
        assert.equal(types.any.validate({}), true)
      })

      it ('should return false if given non-existy', () => {
        assert.equal(types.any.validate(), false)
      })

      it ('should offer a helpful error message', () => {
        assert.equal(
          types.any.makeErrorMessage({ prop: 'test-prop' }), 
          `test-prop should be "any"thing... just not undefined or null`
        )
      })
    })

    describe('kisschema.types.custom', () => {

      it ('should throw if type interface not met', () => {
        assert.throws(types.custom)
      })

      it ('should have isRequired option', () => {
        assert(types.custom({
          validate() {},
          makeErrorMessage() {} 
        }).isRequired)
      })

      it ('should return true if custom type is satisfied', () => {
        var type = types.custom({ 
          validate: (x) => x === 'a custom thing',
          makeErrorMessage: (ctx, x) => 'bad!'
        })
        assert.equal(type.validate('a custom thing'), true)
      })

      it ('should return false if custom type is not satisfied', () => {
        var type = types.custom({ 
          validate: (x) => x === 'a custom thing',
          makeErrorMessage: (ctx, x) => 'bad!'
        })
        assert.equal(type.validate([]), false)
      })

      it ('should offer a helpful error message', () => {
        var type = types.custom({ 
          validate: (x) => x === 'a custom thing',
          makeErrorMessage: (ctx, x) => 'bad!'
        })
        assert.equal(type.makeErrorMessage({ prop: 'test-prop' }), `bad!`)
      })
    })

  })

  describe('kisschema.validate', () => {
    
    it ('should return null if all passed', () => {
      var schema = { a: types.string, b: types.number }
      var obj = { a: '1', b: 1 }
      assert.equal(validate(schema, obj), null)
    })

    it ('should return array of errors if there are failures', () => {
      var schema = { a: types.array, b: types.string, c: types.object }
      var obj = { a: '1', b: 1, c: {} }
      var errors = validate(schema, obj)
      assert.equal(Object.keys(errors).length, 2)
      assert.equal(errors.a, types.array.makeErrorMessage({ prop: 'a' }, '1'))
      assert.equal(errors.b, types.string.makeErrorMessage({ prop: 'b' }, 1))
    })

    it ('should respect isRequired extention', () => {
      var schema = { a: types.string.isRequired, b: types.number }
      var obj = { b: 1 }
      var errors = validate(schema, obj)
      assert.equal(Object.keys(errors).length, 1)
      assert.equal(errors.a, types.string.isRequired.makeErrorMessage({ prop: 'a' }, null))
    })

    describe('options', () => {

      describe('stopOnFail', () => {
        
        it ('should stop immediately on any error', () => {
          var schema = { a: types.string.isRequired, b: types.number }
          var obj = { b: '1' }
          var errors = validate(schema, obj)
          assert.equal(Object.keys(errors).length, 2)
          var limitedErrors = validate(schema, obj, { failFast: true })
          assert.equal(Object.keys(limitedErrors).length, 1)
        })
      })
    })
  })

  describe('kisschema.enforce', () => {

    it ('should return tested data if passed', () => {
      var schema = { a: types.string, b: types.number }
      var obj = { a: '1', b: 1 }
      assert.equal(enforce(schema, obj), obj)
    })

    it ('should throw error if not passed', () => {
      var schema = { a: types.string, b: types.number }
      var obj = { a: '1', b: '1' }
      assert.throws(enforce(schema, obj), Error)
    })
  })
})
