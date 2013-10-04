initialSave = null

window.l = -> {
    style: {},
    getBoundingClientRect: ->
      return {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: 0,
        height: 0
      }
  }

window.testingSetup = ->
  if !Game.ready
    Game.Init()
    initialSave = Game.WriteSave(1);

  Game.LoadSave(initialSave)
  Game.Logic()
