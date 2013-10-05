noop = -> undefined
savedFns =
  drawFunction: []
  special: []
  specialDrawFunction: []
  popup: noop
  l: noop


Shopper = window.Shopper = window.Shopper or {}

Shopper.optimizeLoad = ->
  for id, obj in Game.ObjectsById
    [obj.drawFunction, savedFns.drawFunction[id]] = [noop, obj.drawFunction]
    [obj.special, savedFns.special[id]] = [null, obj.special]
    [obj.specialDrawFunction, savedFns.specialDrawFunction[id]] = [null, obj.specialDrawFunction]

  [Game.Popup, savedFns.popup] = [noop, Game.Popup]
  [window.l, savedFns.l] = [->
      style: {}
      getBoundingClientRect: ->
        top: 0
        bottom: 0
        left: 0
        right: 0
        width: 0
        height: 0
  , window.l]

Shopper.unoptimizeLoad = ->
  for id, obj in Game.ObjectsById
    obj.drawFunction = savedFns.drawFunction[id]
    obj.special = savedFns.special[id]
    obj.specialDrawFunction = savedFns.specialDrawFunction[id]

  Game.Popup = savedFns.popup
  window.l = savedFns.l

Shopper.safeCall = (fn) ->
  shallowCopy = (dst, src) ->
    for k, v of src
      dst[k] = v

  initialState = Game.WriteSave(1)
  unrestored = JSON.stringify([Game.frenzy, Game.frenzyPower, Game.clickFrenzy, Game.goldenCookie])
  ret = fn()
  Game.LoadSave(initialState)
  [Game.frenzy, Game.frenzyPower, Game.clickFrenzy, gc] = JSON.parse(unrestored)
  shallowCopy(Game.goldenCookie, gc)
  ret

