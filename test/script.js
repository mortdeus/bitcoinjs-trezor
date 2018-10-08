/* global describe, it */

var assert = require('assert')
var bscript = require('../src/script')
var minimalData = require('minimaldata')

var fixtures = require('./fixtures/script.json')
var fixtures2 = require('./fixtures/templates.json')

describe('script', function () {
  describe('fromASM/toASM', function () {
    fixtures.valid.forEach(function (f) {
      it('encodes/decodes ' + f.asm, function () {
        var script = bscript.fromASM(f.asm)
        assert.strictEqual(bscript.toASM(script), f.asm)
      })
    })

    fixtures.invalid.fromASM.forEach(function (f) {
      it('throws ' + f.description, function () {
        assert.throws(function () {
          bscript.fromASM(f.script)
        }, new RegExp(f.description))
      })
    })
  })

  describe('fromASM/toASM (templates)', function () {
    fixtures2.valid.forEach(function (f) {
      if (f.outputHex) {
        it('encodes/decodes ' + f.output, function () {
          var script = bscript.fromASM(f.output)
          assert.strictEqual(script.toString('hex'), f.outputHex)
          assert.strictEqual(bscript.toASM(script), f.output)
        })
      }
    })
  })

  describe('compile (via fromASM)', function () {
    fixtures.valid.forEach(function (f) {
      it('(' + f.type + ') compiles ' + f.asm, function () {
        var scriptSig = bscript.fromASM(f.asm)

        assert.strictEqual(scriptSig.toString('hex'), f.script)

        if (f.nonstandard) {
          var scriptSigNS = bscript.fromASM(f.nonstandard.scriptSig)

          assert.strictEqual(scriptSigNS.toString('hex'), f.script)
        }
      })
    })
  })

  describe('decompile', function () {
    fixtures.valid.forEach(function (f) {
      it('decompiles ' + f.asm, function () {
        var chunks = bscript.decompile(Buffer.from(f.script, 'hex'))

        assert.strictEqual(bscript.compile(chunks).toString('hex'), f.script)
        assert.strictEqual(bscript.toASM(chunks), f.asm)

        if (f.nonstandard) {
          var chunksNS = bscript.decompile(Buffer.from(f.nonstandard.scriptSigHex, 'hex'))

          assert.strictEqual(bscript.compile(chunksNS).toString('hex'), f.script)

          // toASM converts verbatim, only `compile` transforms the script to a minimalpush compliant script
          assert.strictEqual(bscript.toASM(chunksNS), f.nonstandard.scriptSig)
        }
      })
    })

    fixtures.invalid.decompile.forEach(function (f) {
      it('decompiles ' + f.script + ' to [] because of "' + f.description + '"', function () {
        var chunks = bscript.decompile(Buffer.from(f.script, 'hex'))

        assert.strictEqual(chunks.length, 0)
      })
    })
  })

  describe('SCRIPT_VERIFY_MINIMALDATA policy', function () {
    fixtures.valid.forEach(function (f) {
      it('compliant for ' + f.type + ' scriptSig ' + f.asm, function () {
        var script = Buffer.from(f.script, 'hex')

        assert(minimalData(script))
      })
    })

    function testEncodingForSize (i) {
      it('compliant for data PUSH of length ' + i, function () {
        var buffer = Buffer.alloc(i)
        var script = bscript.compile([buffer])

        assert(minimalData(script), 'Failed for ' + i + ' length script: ' + script.toString('hex'))
      })
    }

    for (var i = 0; i < 520; ++i) {
      testEncodingForSize(i)
    }
  })
})
