import { defineStore } from "pinia"
import { ref } from "vue"

export const useColor = defineStore('color', () => {
  const color = ref<string>('#4a4a4a')

  function changeColor(newColor: string) {
    color.value = newColor
  }

  return {
    color,
    changeColor
  }
})