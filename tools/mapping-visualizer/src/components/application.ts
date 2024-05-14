import "./visualizer";
import * as ko from "knockout";
import html from "~/lib/html";
import { type Snapshot } from "~/lib/text-range";

enum Stage {
  Meta,
  Snapshot,
  View,
}

ko.components.register("application", {
  template: html`
    <!-- ko if: stage() === Stage.Meta -->
    <h1>Paste metafile</h1>
    <form data-bind="submit: submitMeta" id="meta-form">
      <div>
        <textarea name="meta" rows="30" cols="100"></textarea>
      </div>
      <button type="submit">Submit</button>
    </form>
    <!-- /ko -->

    <!-- ko if: stage() === Stage.Snapshot -->
    <h1>Pick Snapshot</h1>
    <form data-bind="submit: submitSnapshot" id="snapshot-form">
      <div>
        <select
          name="name"
          data-bind="options: snapshots().map((snapshot) => snapshot.name)"
        ></select>
      </div>
      <div>
        <label>
          Remember:
          <input type="checkbox" name="remember" />
        </label>
      </div>
      <button type="submit">Submit</button>
    </form>
    <!-- /ko -->

    <!-- ko if: stage() === Stage.View -->
    <!-- ko component: {
      name: 'visualizer',
      params: {
        snapshot: snapshot()
      }
    } --><!-- /ko -->
    <!-- /ko -->
  `,
  viewModel: class {
    readonly Stage = Stage;

    readonly defaultEditorText = `<!-- ok with: default from "./viewmodel.js" -->
   <div data-bind="text: text"></div>
  <!-- /ok -->\n`;

    readonly stage = ko.observable(Stage.Meta);
    readonly snapshots = ko.observable<readonly Snapshot[]>();
    readonly snapshot = ko.observable<Snapshot>();

    constructor() {
      const stored = localStorage.getItem("snapshot");
      if (stored) {
        this.snapshot(JSON.parse(stored));
        this.stage(Stage.View);
      }
    }

    submitMeta(event: SubmitEvent) {
      const form = document.getElementById("meta-form") as HTMLFormElement;
      const formData = new FormData(form, event.submitter);
      const metaText = formData.get("meta") as string;
      const meta = JSON.parse(metaText);
      this.snapshots(meta.snapshots);
      this.stage(Stage.Snapshot);
    }

    submitSnapshot(event: SubmitEvent) {
      const form = document.getElementById("snapshot-form") as HTMLFormElement;
      const formData = new FormData(form, event.submitter);
      const name = formData.get("name") as string;
      const remember = formData.get("remember") === "on";
      this.snapshot(
        this.snapshots()?.find((snapshot) => snapshot.name === name),
      );
      if (remember) {
        localStorage.setItem("snapshot", JSON.stringify(this.snapshot()));
      }
      this.stage(Stage.View);
    }
  },
});
