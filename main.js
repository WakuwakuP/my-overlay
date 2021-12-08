const smn = new Image('./public/img/smn.png')

const overlay = new OverlayAPI({
  extendData: true,
  silentMode: false,
  seperateLB: true,
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
    return jobTypeColor[jobType]
  }

  return 'rgba(128,0,255,0.3)'
}

const app = new Vue({
  el: '#app',
  data: {
    time: "00:00",
    encounter: "Encounter",
    totalDps: 0,
    combatData: [],
  },
  methods: {
    update(data) {
      this.combatData = data.extendData.combatant
      this.time = data.extendData.encounter.duration
      this.totalDps = data.extendData.encounter.dps
    },
  },
  mounted() {
    overlay.addListener('CombatData', (data) => {
      this.update(data)
      console.log('listener of `CombatData`', data)
    })
    overlay.addListener('ChangeZone', (data) => {
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
    sortedCombatData() {
      const maxDps = Math.max(...this.combatData.map(data => data.dps))
      return this.combatData.sort((a, b) => {
        if (a.dps < b.dps) {
          return 1
        }
        if (a.dps > b.dps) {
          return -1
        }
        return 0
      }).map(data => {
        const dpsRange = Math.trunc(data.dps / this.maxDps * 100)
        data.jobIcon = data.job ? `./img/icons/${data.job}.png` : './img/icons/error.png'
        if (/.* \(.*\)/.test(data.name)) {
          data.jobIcon = './img/icons/choco.png'
        }
        data.background
          = `linear-gradient(to right, rgba(0, 0, 0, 0), ${jobColor(data)} 5%, ${jobColor(data)} ${dpsRange - 5}%, rgba(0, 0, 0, 0) ${dpsRange}%, rgba(0, 0, 0, 0))`
        return data
      })
    },
    maxDps() {
      return Math.max(...this.combatData.map(data => data.dps)) || 1
    }
  }
})
