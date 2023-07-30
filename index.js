'use strict'

const async = require('async')
const _ = require('lodash')
const Fastify = require('fastify')
const Base = require('bfx-facs-base')
const debug = require('debug')('hp:rpc')

const DEFAULT_ROUTES = [
  {
    method: 'GET',
    url: '/echo',
    schema: {
      querystring: {
        type: 'object',
        properties: {
          value: { type: 'string'}
        },
        required: ['value'],
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

class HttpServerFacility extends Base {
  constructor (caller, opts, ctx) {
    super(caller, opts, ctx)

    this.name = 'server-http'
    this._hasConf = true

    this.init()
  }

  _start (cb) {
    async.series([
      next => { super._start(next) },
      async () => {
        const fastify = Fastify({
          logger: this.opts.logger
        })

        this.server = fastify

        if (this.opts.addDefaultRoutes) {
          _.each(DEFAULT_ROUTES, r => {
            this.server.route(r)
          })
        }

        _.each(this.opts.routes, r => {
          this.server.route(r)
        })

        await this.server.listen({
          port: this.opts.port || this.conf.port
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
