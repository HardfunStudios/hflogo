import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    setTimeout(() => this.element.remove(), 4000)
  }

  remove() {
    this.element.remove()
  }
}
