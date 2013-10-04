describe('CPS functions', ->
  beforeEach(window.testingSetup)

  describe('cpsGainNoRevert', ->
    it('should calculate the amount of additional cps a purchase grants', ->
      cursor = Game.ObjectsById[0]
      expect(Shopper.cpsGainUnsafe(cursor)).toBe(0.1)

      grandma = Game.ObjectsById[1]
      expect(Shopper.cpsGainUnsafe(grandma)).toBe(0.5)
    )
  )

  describe('cpsGain', ->
    it('should calculate the amount of additional cps a purchase grants', ->
      cursor = Game.ObjectsById[0]
      expect(Shopper.cpsGain(cursor)).toBe(0.1)

      grandma = Game.ObjectsById[1]
      expect(Shopper.cpsGain(grandma)).toBe(0.5)
    )

    it('should not mess with game state', ->
      initialState = Game.WriteSave(1)
      cursor = Game.ObjectsById[0]

      Shopper.cpsGain(cursor)
      expect(Game.WriteSave(1)).toBe(initialState)
    )
  )

  describe('cpsGainPerSecond', ->
    it('should calculate the cps/s a purchase grants', ->
      cursor = Game.ObjectsById[0]

      expect(Shopper.cpsGainPerSecond(cursor)).toBe(0)

      Game.cookies = cursor.price
      cursor.buy()

      expect(Shopper.getCps()).toBe(0.1)
      expect(Shopper.cpsGainPerSecond(cursor)).toBeCloseTo(0.000579, 3)
    )

    it('should not mess with game state', ->
      initialState = Game.WriteSave(1)
      cursor = Game.ObjectsById[0]

      Shopper.cpsGainPerSecond(cursor)
      expect(Game.WriteSave(1)).toBe(initialState)
    )
  )
)
