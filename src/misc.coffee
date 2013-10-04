noop = -> undefined
savedFns = {
  drawFunction: [],
  special: [],
  specialDrawFunction: [],
  popup: noop
}

Shopper = window.Shopper = window.Shopper or {}

Shopper.optimizeLoad = ->
  for id, obj in Game.ObjectsById
    [obj.drawFunction, savedFns.drawFunction[id]] = [noop, obj.drawFunction]
    [obj.special, savedFns.special[id]] = [null, obj.special]
    [obj.specialDrawFunction, savedFns.specialDrawFunction[id]] = [null, obj.specialDrawFunction]

  [Game.Popup, savedFns.popup] = [noop, Game.Popup]

Shopper.unoptimizeLoad = ->
  for id, obj in Game.ObjectsById
    obj.drawFunction = savedFns.drawFunction[id]
    obj.special = savedFns.special[id]
    obj.specialDrawFunction = savedFns.specialDrawFunction[id]

  Game.Popup = savedFns.popup

Shopper.safeCall = (fn) ->
  initialState = Game.WriteSave(1)
  ret = fn()
  Game.LoadSave(initialState)
  ret

