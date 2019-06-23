// Questions
const questionList = [{
  type: 'question',
  question: 'In which country was the Caesar salad invented?',
  a: 'Mexico',
  b: 'Spain',
  c: 'England',
  answer: 'a'
},
{
  type: 'question',
  question: 'How long did the 100 years war last?',
  a: '100 years',
  b: '113 years',
  c: '116 years',
  answer: 'c'
},
{ 
  type: 'game1',
  instruction: 'Click the ball before the time runs out.'
},
{
  type: 'question',
  question: 'After which animal are the Canary Islands named?',
  a: 'Rabbits',
  b: 'Dogs',
  c: 'Sheep',
  answer: 'b'
},
{
  type: 'question',
  question: 'What colour to do you get when you mix red and white?',
  a: 'Orange',
  b: 'Pink',
  c: 'Brown',
  answer: 'b'
},
{ 
  type: 'game2',
  instruction: 'Press the button to start, and then press again after you think 10 seconds have passed. You need to be within half a second to win.'
},
{
  type: 'question',
  question: 'What is the singular of Scampi?',
  a: 'Scamp',
  b: 'Scampo',
  c: 'Scampi',
  answer: 'b'
},
{
  type: 'question',
  question: 'What colour are aircraft black boxes?',
  a: 'Orange',
  b: 'Black',
  c: 'Yellow',
  answer: 'a'
},
{ 
  type: 'game3',
  instruction: 'Click on the cup covering the ball'
}];

// Vuex Store
const store = new Vuex.Store({
  state: {
    currentQuestion: 1,
    questions: questionList,
    score: 0
  },
  mutations: {
    INCREASE_QUESTION: function(state) {
      state.currentQuestion++;
    }
  },
  actions: {
    increaseQuestion: ({commit}) => {
      commit('INCREASE_QUESTION')
    }
  }
})

const Start = {
  template: '#start',
  created(){
    this.$store.state.currentQuestion = 1;
    this.$store.state.score = 0;
  },
  afterLeave(){
    window.scroll(0,0)
  }
}

const QuestionDetail = {
  template: '#question-detail',
  name: 'QuestionDetail',
  data(){
    return {
      answered: false,
      feedback: '',
      correct: false,
      answerIsA: false,
      answerIsB: false,
      answerIsC: false
    }
  },
  props: ['question'],
  methods: {
    select(answer){
      if(this.question.answer == answer){
        this.$store.state.score+=500;
        this.correct = true;
        this.feedback = 'Correct'
      }
      else {
        this.feedback = 'Wrong answer'
      }
      switch (this.question.answer) {
        case 'a':
        this.answerIsA = true;
        break;
        
        case 'b':
        this.answerIsB = true;
        break;
        
        case 'c':
        this.answerIsC = true;
        break;
      }
      this.answered = true
      setTimeout(()=>{
        this.$emit('selected')
      }, 3000)
    }
  },
  computed: {
    ...Vuex.mapState(['score']),
    classObject: function(){
      return {
        flashCorrect: this.correct,
        flashIncorrect: !this.correct
      }
    }
  },
  mounted () {
     window.scroll(0,0)
  }
}

const Game1 = {
  template: '#game1',
  name: 'GameDetail',
  data(){
    return{
      timeRemaining: 10,
      complete: false,
      winner: false
    }
  },
  props: ['game'],
  methods: {
    gotIt: function(){
      this.$store.state.score+=1000;
      this.winner = true;
      this.complete = true;
    } 
  },
  created(){
    setInterval(()=>{
      this.timeRemaining--;
      if(this.timeRemaining == 0){
        this.complete = true; 
      }
    }, 1000);
  },
  mounted(){
    window.scroll(0,0)
  }
}

const Game2 = {
  template: '#game2',
  name: 'Game2',
  data(){
    return{
      started: false,
      complete: false,
      success: false,
      timer: 0,
      finalTime: 0,
    }
  },
  props: ['game'],
  methods: {
    startTimer(){
      this.started = true;
      setInterval(()=>{
        this.timer+=10;
      }, 10);
    },
    stopTimer(){
      this.finalTime = this.timer/1000;
      let timeAway = 10000 - this.timer;
      if(timeAway >= -500 && timeAway <= 500){
        this.$store.state.score+=1000;
        this.success = true;
      } 
      this.complete = true;
    }
  },
  mounted(){
    window.scroll(0,0)
  }
}

const Game3 = {
  template: '#game3',
  name: 'Game3',
  data(){
    return{
      inProgress: false,
      complete: false,
      correct: false
    }
  },
  props: ['game'],
  methods: {
    selectCorrectCup(){
      this.$store.state.score+=1000;
      this.correct = true;
      this.complete = true;
    },
    selectWrongCup(){
      this.complete = true;
    }
  },
  created(){
    setTimeout(()=>{
      this.inProgress = true;
    },8000);
  },
  mounted(){
    window.scroll(0,0)
  }
}

const Question = {
  template: '#question',
  name: 'question',
  data(){
    return{
      show: true
    }
  },
  components: {
    'questiondetail': QuestionDetail,
    'game1': Game1,
    'game2': Game2,
    'game3': Game3
  },
  methods: {
    ...Vuex.mapActions([
      'increaseQuestion'
    ]),
    nextQuestion(){
      this.increaseQuestion();
      // Check if there are any more questions
      if(this.$store.state.currentQuestion <= this.$store.state.questions.length){
        this.$router.push('/question')
      }
      else {
        this.$router.push('/result')
      } 
    }
  },
  computed: {
    ...Vuex.mapState([
      'currentQuestion',
      'questions',
      'score'
    ]),
    questionType(){
      return this.questions[this.currentQuestion-1].type;
    }
  },
  created(){
    if(this.$store.state.currentQuestion > this.$store.state.questions.length){
      this.$router.push('/')
      this.show = false
    }
  }
}

const Result = {
  template: '#result',
  computed: {
    ...Vuex.mapState(['score'])
  },
  mounted () {
    window.scroll(0,0)
  }
}

// Vue Router
Vue.use(VueRouter)
const router = new VueRouter({
  routes: [
    {
      path: '/',
      name: 'start',
      component: Start
    },
    {
      path: '/question',
      name: 'question',
      component: Question
    },
    {
      path: '/result',
      name: 'result',
      component: Result
    }
  ]
})

new Vue({
  el: '#app',
  name: 'app',
  router,
  store
});