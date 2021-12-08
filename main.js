const smn = new Image('./public/img/smn.png')

const overlay = new OverlayAPI({
  extendData: true,
  silentMode: false,
  // seperateLB: true,
});

const jobColor = (data) => {
  const jobTypeColor = {
    'dps': 'rgba(200, 3, 8, 0.3)',
    'tank': 'rgba(41,112,243,0.3)',
    'healer': 'rgba(107,240,86,0.3)',
  }
  if (/.* \(.*\)/.test(data.name)) {
    return 'rgba(255, 230, 0, 0.3)'
  }
  if (data.jobType) {
    return jobTypeColor[data.jobType]
  }

  return 'rgba(128,0,255,0.3)'
}

let count = undefined;

const app = new Vue({
  el: '#app',
  data: {
    time: "00:00",
    encounter: "Encounter",
    zoneName: "no data",
    totalDps: 0,
    totalHps: 0,
    combatData: [],
    isActive: false,
  },
  methods: {
    update(data) {
      this.combatData = data.extendData.combatant
      this.time = data.extendData.encounter.duration
      this.encounter = data.Encounter.title
      this.totalDps = data.extendData.encounter.dps | 0
      this.totalHps = data.extendData.encounter.hps | 0
      this.isActive = data.isActive
    },
    updateZone(data) {
      this.zoneName = data.zoneName
      if (this.isActive) {
        this.combatData = this.combatData.filter(data => data.name == "You")
      } else {
        this.combatData = []
      }
    },
  },
  mounted() {
    overlay.addListener('CombatData', (data) => {
      this.update(data)
      console.log('listener of `CombatData`', data)
    })
    overlay.addListener('ChangeZone', (data) => {
      this.updateZone(data)
      console.log('listener of `ChangeZone`', data)
    });
    overlay.startEvent();
    console.log(this.combatData)
  },
  beforeDestroy: function () {
  },
  computed: {
    active() {
      return this.combatData.length != 0
    },
    hpsTableActive() {
      return this.sortedCombatDataHps.length !== 0
    },
    shapingCombatData() {
      return this.combatData.sort((a, b) => {
        if (a.dps < b.dps) {
          return 1
        }
        if (a.dps > b.dps) {
          return -1
        }
        return 0
      }).map(data => {
        data.jobIcon = data.job ? `./img/icons/${data.job}.png` : './img/icons/error.png'
        if (/.* \(.*\)/.test(data.name)) {
          data.jobIcon = './img/icons/choco.png'
        }
        if (data.name === "Limit Break") {
          data.jobIcon = './img/icons/Limit Break.png'
          data.name = 'LB ' + (data.maxHit || data.maxHeal)
        }

        return data
      })
    },
    sortedCombatDataDps() {
      const maxDps = Math.max(...this.combatData.map(data => data.dps))
      return this.shapingCombatData
        .sort((a, b) => {
          if (a.dps < b.dps) {
            return 1
          }
          if (a.dps > b.dps) {
            return -1
          }
          return 0
        })
        .filter(data => !/LB\s.*/.test(data.name) || !!data.maxHit)
        .map(data => {
          const dpsRange = Math.trunc(data.dps / maxDps * 100)
          data.background
            = `linear-gradient(to right, rgba(0, 0, 0, 0), ${jobColor(data)} 5%, ${jobColor(data)} ${dpsRange - 5}%, rgba(0, 0, 0, 0) ${dpsRange}%, rgba(0, 0, 0, 0))`
          return data
        })
    },
    sortedCombatDataHps() {
      return this.shapingCombatData
        .sort((a, b) => {
          if (a.hps < b.hps) {
            return 1
          }
          if (a.hps > b.hps) {
            return -1
          }
          return 0
        })
        .filter(data => {
          return (data.hasOwnProperty('healsPct') ? data.healsPct : "5").replace(/[^0-9]/g, '') >= 8 || !!data.maxHeal
        })
        .map(data => {
          const healsPct = (data.hasOwnProperty('healsPct') ? data.healsPct : "100").replace(/[^0-9]/g, '')
          data.backgroundHps
            = `linear-gradient(to right, rgba(0, 0, 0, 0), ${jobColor(data)} 5%, ${jobColor(data)} ${healsPct - 5}%, rgba(0, 0, 0, 0) ${healsPct}%, rgba(0, 0, 0, 0))`
          return data
        })
    },
  }
})
