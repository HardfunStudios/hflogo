import { application } from "controllers/application"
import EditorController from "controllers/editor_controller"
import FlashController from "controllers/flash_controller"

application.register("editor", EditorController)
application.register("flash", FlashController)
