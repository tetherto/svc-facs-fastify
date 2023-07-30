'use strict'

const async = require('async')
const _ = require('lodash')
const Fastify = require('fastify')
const Base = require('bfx-facs-base')
const debug = require('debug')('hp:server:http')

const DEFAULT_ROUTES = [
  {
    method: 'GET',
    url: '/echo',
    schema: {
      querystring: {
        type: 'object',
        properties: {
          value: { type: 'string' }
        },
        required: ['value']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            value: { type: 'string' }
          }
        }
      }
    },
    handler: async (request, reply) => {
      return { value: request.query.value }
    }
  }
]

class HttpdFacility extends Base {
  constructor (caller, opts, ctx) {
    super(caller, opts, ctx)

    this.name = 'httpd'
    this._hasConf = true

    this.init()

    this.mem = { plugins: [], routes: [] }
  }

  addRoute (r) {
    if (this.server) {
      throw new Error('ERR_FACS_SERVER_HTTP_ALREADY_INITED')
    }

    this.mem.routes.push(r)
  }

  addPlugin (p) {
    if (this.server) {
      throw new Error('ERR_FACS_SERVER_HTTP_ALREADY_INITED')
    }

    this.mem.plugins.push(p)
  }

  async startServer () {
    if (this.server) {
      throw new Error('ERR_FACS_SERVER_HTTP_CREATE_DUP')
    }

    const fastify = Fastify({
      logger: this.opts.logger
    })

    this.server = fastify

    _.each(this.mem.plugins, p => {
      this.server.register(p[0], p[1])
    })

    if (this.opts.addDefaultRoutes) {
      _.each(DEFAULT_ROUTES, r => {
        this.server.route(r)
      })
    }

    _.each(this.mem.routes, r => {
      this.server.route(r)
    })

    return await this.server.listen({
      port: this.opts.port || this.conf.port
    })
  }

  _start (cb) {
    async.series([
      next => { super._start(next) },
      async () => {
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

module.exports = HttpdFacility
