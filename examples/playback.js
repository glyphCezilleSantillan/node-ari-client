/**
 *  This example shows how a playback can be controlled on a channel using
 *  channel dtmf events.
 *
 *  @namespace playback-example
 *
 *  @copyright 2014, Digium, Inc.
 *  @license Apache License, Version 2.0
 *  @author Samuel Fortier-Galarneau <sgalarneau@digium.com>
 *  @example <caption>Dialplan</caption>
 *  exten => 7000,1,NoOp()
 *      same => n,Stasis(playback-example)
 *      same => n,Hangup()
 */

'use strict';

var client = require('ari-client');
var util = require('util');

// replace ari.js with your Asterisk instance
client.connect('http://ari.js:8088', 'user', 'secret',
    /**
     *  Setup event listeners and start application.
     *
     *  @callback connectCallback
     *  @memberof playback-example
     *  @param {Error} err - error object if any, null otherwise
     *  @param {module:ari-client~Client} ari - ARI client
     */
    function (err, ari) {

  // Use once to start the application
  ari.once('StasisStart',
      /**
       *  Once the incoming channel has entered Stasis, answer it, play demo
       *  sound and register dtmf event listeners to control the playback.
       *
       *  @callback stasisStartCallback
       *  @memberof playback-example
       *  @param {Object} event - the full event object
       *  @param {module:resources~Channel} incoming - the channel entering
       *    Stasis
       */
      function (event, incoming) {

    incoming.answer(
        /**
         *  Once the incoming channel has been answered, play demo sound and
         *  register dtmf event listeners to control the playback.
         *
         *  @callback channelAnswerCallback
         *  @memberof playback-example
         *  @param {Error} err - error object if any, null otherwise
         */
        function (err) {

      var playback = ari.Playback();

      // Play demo greeting and register dtmf event listeners
      incoming.play(
        {media: 'sound:demo-congrats'},
        playback,
        function (err, playback) {
          registerDtmfListeners(err, playback, incoming);
        }
      );
    });
  });

  /**
   *  Register playback dtmf events to control playback.
   *
   *  @function registerDtmfListeners
   *  @memberof playback-example
   *  @param {Error} err - error object if any, null otherwise
   *  @param {module:resources~Playback} playback - the playback object to
   *    control
   *  @param {module:resources~Channel} incoming - the incoming channel
   *    responsible for playing and controlling the playback sound
   */
  function registerDtmfListeners (err, playback, incoming) {
    incoming.on('ChannelDtmfReceived',
        /**
         *  Handle DTMF events to control playback. 5 pauses the playback, 8
         *  unpauses the playback, 4 moves the playback backwards, 6 moves the
         *  playback forwards, 2 restarts the playback, and # stops the playback
         *  and hangups the channel.
         *
         *  @callback channelDtmfReceivedCallback
         *  @memberof playback-example
         *  @param {Object} event - the full event object
         *  @param {module:resources~Channel} channel - the channel on which
         *    the dtmf event occured
         */
        function (event, channel) {

      var digit = event.digit;

      switch (digit) {
        case '5':
          playback.control({operation: 'pause'}, function(err) {});
          break;
        case '8':
          playback.control({operation: 'unpause'}, function(err) {});
          break;
        case '4':
          playback.control({operation: 'reverse'}, function(err) {});
          break;
        case '6':
          playback.control({operation: 'forward'}, function(err) {});
          break;
        case '2':
          playback.control({operation: 'restart'}, function(err) {});
          break;
        case '#':
          playback.control({operation: 'stop'}, function(err) {});
          incoming.hangup(function (err) {
            process.exit(0);
          });
          break;
        default:
          console.error(util.format('Unknown DTMF %s', digit));
      }
    });
  }

  // can also use ari.start(['app-name'...]) to start multiple applications
  ari.start('playback-example');
});
