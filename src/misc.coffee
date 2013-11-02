noop = -> undefined
savedGlobalFns =
  popup: noop
  l: noop

savedObjFns =
  drawFunction: []
  special: []
  specialDrawFunction: []
  clickFunction: []

savedUpgradeFns =
  drawFunction: []
  special: []
  specialDrawFunction: []
  clickFunction: []


Shopper = window.Shopper = window.Shopper or {}

Shopper.optimizeLoad = ->
  for id, obj in Game.ObjectsById
    [obj.drawFunction, savedObjFns.drawFunction[id]] = [noop, obj.drawFunction]
    [obj.special, savedObjFns.special[id]] = [null, obj.special]
    [obj.specialDrawFunction, savedObjFns.specialDrawFunction[id]] = [null, obj.specialDrawFunction]
    [obj.clickFunction, savedObjFns.clickFunction[id]] = [null, obj.clickFunction]

  for id, upgrade in Game.UpgradesById
    [upgrade.drawFunction, savedUpgradeFns.drawFunction[id]] = [noop, upgrade.drawFunction]
    [upgrade.special, savedUpgradeFns.special[id]] = [null, upgrade.special]
    [upgrade.specialDrawFunction, savedUpgradeFns.specialDrawFunction[id]] = [null, upgrade.specialDrawFunction]
    [upgrade.clickFunction, savedUpgradeFns.clickFunction[id]] = [null, upgrade.clickFunction]

  [Game.Popup, savedGlobalFns.popup] = [noop, Game.Popup]
  [window.l, savedGlobalFns.l] = [->
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
    obj.drawFunction = savedObjFns.drawFunction[id]
    obj.special = savedObjFns.special[id]
    obj.specialDrawFunction = savedObjFns.specialDrawFunction[id]
    obj.clickFunction = savedObjFns.clickFunction[id]

  for id, upgrade in Game.UpgradesById
    upgrade.drawFunction = savedUpgradeFns.drawFunction[id]
    upgrade.special = savedUpgradeFns.special[id]
    upgrade.specialDrawFunction = savedUpgradeFns.specialDrawFunction[id]
    upgrade.clickFunction = savedUpgradeFns.clickFunction[id]

  Game.Popup = savedGlobalFns.popup
  window.l = savedGlobalFns.l

Shopper.safeCall = (fn) ->
  shallowCopy = (dst, src) ->
    for k, v of src
      dst[k] = v

  initialState = Game.WriteSave(1)
  unrestored = JSON.stringify([Game.frenzy, Game.frenzyPower, Game.clickFrenzy, Game.goldenCookie, Game.wrinklers])
  ret = fn()
  Game.LoadSave(initialState)
  [Game.frenzy, Game.frenzyPower, Game.clickFrenzy, gc, Game.wrinklers] = JSON.parse(unrestored)
  shallowCopy(Game.goldenCookie, gc)
  ret
