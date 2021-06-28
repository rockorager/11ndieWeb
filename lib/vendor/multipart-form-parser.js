// Author: Salvador Guerrero
// Source: https://javascript.plainenglish.io/parsing-post-data-3-different-ways-in-node-js-e39d9d11ba8

'use strict'

const querystring = require('querystring')

const kApplicationJSON = 'application/json'
const kApplicationFormUrlEncoded = 'application/x-www-form-urlencoded'
const kMultipartFormData = 'multipart/form-data'

function endRequestWithError(response, body, statusCode, message, cb) {
  response.statusCode = statusCode
  if (message && message.length > 0) {
    response.setHeader('Content-Type', 'application/json')
    body.end(JSON.stringify({message: message}))
    if (cb) cb(new Error(message))
  } else {
    body.end()
    if (cb) cb(new Error(`Error with statusCode: ${statusCode}`))
  }
}

function getMatching(string, regex) {
  // Helper function when using non-matching groups
  const matches = string.match(regex)
  if (!matches || matches.length < 2) {
    return null
  }
  return matches[1]
}

function getBoundary(contentTypeArray) {
  const boundaryPrefix = 'boundary='
  let boundary = contentTypeArray.find(item => item.startsWith(boundaryPrefix))
  if (!boundary) return null
  boundary = boundary.slice(boundaryPrefix.length)
  if (boundary) boundary = boundary.trim()
  return boundary
}

exports.readRequestDataInMemory = (request, response, body, maxLength, callback) => {
  const contentLength = parseInt(request.headers['content-length'])

  if (isNaN(contentLength)) {
    endRequestWithError(response, body, 411, 'Length required', callback)
    return
  }

  // Don't need to validate while reading, V8 runtime only reads what content-length specifies.
  if (contentLength > maxLength) {
    endRequestWithError(response, body, 413, `Content length is greater than ${maxLength} Bytes`, callback)
    return
  }

  let contentType = request.headers['content-type']
  const contentTypeArray = contentType.split(';').map(item => item.trim())
  if (contentTypeArray && contentTypeArray.length) {
    contentType = contentTypeArray[0]
  }

  if (!contentType) {
    endRequestWithError(response, body, 400, 'Content type not specified', callback)
    return
  }

  if (!/((application\/(json|x-www-form-urlencoded))|multipart\/form-data)/.test(contentType)) {
    endRequestWithError(response, body, 400, 'Content type is not supported', callback)
    return
  }

  if (contentType === kMultipartFormData) {
    // Use latin1 encoding to parse binary files correctly
    // request.setEncoding('latin1')
  } else {
    // request.setEncoding('utf8')
  }


  let rawData = request.body;
  /*
  request.on('data', chunk => {
    rawData += chunk
  })
  */
  // request.on('end', () => {
    switch (contentType) {
      case kApplicationJSON: {
        try {
          callback(null, JSON.parse(rawData))
        } catch (e) {
          endRequestWithError(response, body, 400, 'There was an error trying to parse the data as JSON')
          callback(e)
        }
        break
      }
      case kApplicationFormUrlEncoded: {
        try {
          let parsedData = querystring.decode(rawData)
          callback(null, parsedData)
        } catch (e) {
          endRequestWithError(response, body, 400, 'There was an error trying to parse the form data')
          callback(e)
        }
        break
      }
      case kMultipartFormData: {
        const boundary = getBoundary(contentTypeArray)
        if (!boundary) {
          endRequestWithError(response, body, 400, 'Boundary information missing', callback)
          return
        }
        let result = {}
        const rawDataArray = rawData.split(boundary)
        for (let item of rawDataArray) {
          // Use non-matching groups to exclude part of the result
          let name = getMatching(item, /(?:name=")(.+?)(?:")/)
          if (!name || !(name = name.trim())) continue
          let value = getMatching(item, /(?:\r\n\r\n)([\S\s]*)(?:\r\n--$)/)
          if (!value) continue
          let filename = getMatching(item, /(?:filename=")(.*?)(?:")/)
          if (filename && (filename = filename.trim())) {
            // Add the file information in a files array
            let file = {}
            file[name] = value
            file['filename'] = filename
            let contentType = getMatching(item, /(?:Content-Type:)(.*?)(?:\r\n)/)
            if (contentType && (contentType = contentType.trim())) {
              file['Content-Type'] = contentType
            }
            if (!result.files) {
              result.files = []
            }
            result.files.push(file)
          } else {
            // Key/Value pair
            result[name] = value
          }
        }
        return result;
        // callback(null, result)
        break
      }
      default: {
        callback(null, rawData)
      }
    }
  // }) request.on(end ....)
}