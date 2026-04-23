import { Controller } from "@hotwired/stimulus"

const AUTOSAVE_DELAY = 30_000  // 30 segundos

export default class extends Controller {
  static targets = ["titleInput", "saveStatus", "saveVersionBtn", "publishBtn"]
  static values  = {
    projectId:    Number,
    projectData:  Object,
    autosaveUrl:  String,
    versionsUrl:  String,
    thumbnailUrl: String,
    csrfToken:    String,
  }

  connect() {
    // Aguarda o bundle do editor carregar antes de inicializar
    this._waitForEditor(() => this._initEditor())
  }

  disconnect() {
    clearTimeout(this._saveTimer)
  }

  // ── Inicialização ──────────────────────────────────────────────────────────

  _waitForEditor(callback, retries = 30) {
    if (window.LogoEditor && window.workspace) {
      callback()
    } else if (retries > 0) {
      setTimeout(() => this._waitForEditor(callback, retries - 1), 200)
    } else {
      console.error("LogoEditor não carregou no tempo esperado")
    }
  }

  _initEditor() {
    window.LogoEditor.onChanged((state) => {
      this._pendingState = state
      this._scheduleAutosave()
    })

    // Carrega os dados do projeto no workspace
    if (this.projectDataValue && Object.keys(this.projectDataValue).length > 0) {
      window.LogoEditor.loadProjectState(this.projectDataValue)
    }
  }

  // ── Auto-save ──────────────────────────────────────────────────────────────

  _scheduleAutosave() {
    clearTimeout(this._saveTimer)
    this._saveTimer = setTimeout(() => this._doAutosave(), AUTOSAVE_DELAY)
    this._setSaveStatus("com alterações não salvas…")
  }

  async _doAutosave() {
    if (!this._pendingState) return
    try {
      await this._patchProject({ data: this._pendingState })
      this._setSaveStatus("salvo automaticamente")
      this._pendingState = null
      this._sendThumbnail()
    } catch (e) {
      this._setSaveStatus("erro ao salvar — tente novamente")
      console.error("Autosave error:", e)
    }
  }

  // ── Ações do header ────────────────────────────────────────────────────────

  async updateTitle() {
    const title = this.titleInputTarget.value.trim()
    if (!title) return
    await this._patchProject({ title })
  }

  async saveVersion() {
    const changeNote = prompt("Nota para esta versão (opcional):")
    if (changeNote === null) return  // cancelado
    try {
      await this._postVersion(changeNote)
      this._setSaveStatus("versão salva!")
    } catch (e) {
      alert("Erro ao salvar versão: " + e.message)
    }
  }

  async publish() {
    await this._patchProject({ visibility: "published" })
    if (this.hasPublishBtnTarget) {
      this.publishBtnTarget.textContent = "Publicado ✓"
    }
  }

  async changeVisibility(event) {
    await this._patchProject({ visibility: event.target.value })
  }

  // ── HTTP helpers ───────────────────────────────────────────────────────────

  async _patchProject(body) {
    const res = await fetch(this.autosaveUrlValue, {
      method:  "PATCH",
      headers: this._jsonHeaders(),
      body:    JSON.stringify({ project: body }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }

  async _postVersion(changeNote) {
    const res = await fetch(this.versionsUrlValue, {
      method:  "POST",
      headers: this._jsonHeaders(),
      body:    JSON.stringify({ change_note: changeNote }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json()
  }

  _sendThumbnail() {
    const svg = window.LogoEditor?.getThumbnailSVG()
    if (!svg) return
    fetch(this.thumbnailUrlValue, {
      method:  "POST",
      headers: this._jsonHeaders(),
      body:    JSON.stringify({ svg }),
    }).catch(() => {})
  }

  _jsonHeaders() {
    return {
      "Content-Type":  "application/json",
      "Accept":        "application/json",
      "X-CSRF-Token":  this.csrfTokenValue,
    }
  }

  _setSaveStatus(msg) {
    if (this.hasSaveStatusTarget) {
      this.saveStatusTarget.textContent = msg
    }
  }
}
