'use strict'

const async = require('async')
const Fastify = require('fastify')
const Base = require('bfx-facs-base')
const debug = require('debug')('hp:rpc')

class HttpServerFacility extends Base {
  constructor (caller, opts, ctx) {
    super(caller, opts, ctx)

    this.name = 'server-http'
    this._hasConf = true

    this.init()
  }

  async handleReply (met, data) {
    try {
      data = this.parseInputJSON(data)
    } catch (e) {
      return this.toOutJSON(`[HRPC_ERR]=${e.message}`)
    }

    try {
      const res = await this.caller[met](data)
      return this.toOutJSON(res)
    } catch (e) {
      return this.toOutJSON(`[HRPC_ERR]=${e.message}`)
    }
  }

  _start (cb) {
    async.series([
      next => { super._start(next) },
      async () => {
        const fastify = Fastify({
          logger: true
        })

        this.server = fastify

        this.server.listen({
          port: this.conf.port
        })
      }
    ], cb)
  }

  _stop (cb) {
    async.series([
      next => { super._stop(next) },
      async () => {
        if (this.server) {
          await this.server.close()
        }
      }
    ], cb)
  }
}

module.exports = HttpServerFacility
