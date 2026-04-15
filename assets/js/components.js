const templates = {
  addToyForm: `
    <form id='add-toy-form' class='mt-5 d-none'>
      <h3>Create a toy!</h3>

      <input type='text' name='name' value='' placeholder="Enter a toy's name..." class='input-text' />
      <br />
      <input type='text' name='image' value='' placeholder="Enter a toy's image URL..." class='input-text' />
      <br />
      <input type='submit' name='submit' value='Create New Toy' class='submit' />

      <div role='alert' class='alert d-none alert-danger w-50 mx-auto mt-2 mb-0 p-2'></div>
    </form>
  `,
  topAction: `
    <p class='text-center'>
      Andy needs your help!
      <button class='btn btn-primary' id='new-toy-btn'>Add a new toy!</button>
    </p>
  `,
  modalConfirm: `
    <div id='modal-delete-toy' role='dialog' aria-describedby='modal-delete-toy' class='modal fade' aria-modal='true'>
      <div class='modal-dialog modal-md modal-dialog-centered'>
        <div tabindex='-1' class='modal-content'>
          <header class='modal-header'>
            <h4 class='mb-0'>Please confirm</h4>
            <button type='button' data-bs-dismiss='modal' aria-label='Close' class='btn btn-close btn-sm'></button>
          </header>

          <div class='modal-body'>
            <p class='mb-0'>Are you sure to delete toy <span class='text-danger toy-info'></span> ?</p>
          </div>

          <footer class='modal-footer'>
            <button type='button' data-bs-dismiss='modal' class='btn btn-secondary'>Close</button>
            <button type='button' class='btn btn-danger btn-confirm'>Yes</button>
          </footer>
        </div>
      </div>
    </div>
  `,
  mosaicLoader: `
    <div class='loader d-none'>
      <div class='mosaic-loader'>
        <div class='cell d-0'></div>
        <div class='cell d-1'></div>
        <div class='cell d-2'></div>
        <div class='cell d-3'></div>
        <div class='cell d-1'></div>
        <div class='cell d-2'></div>
        <div class='cell d-3'></div>
        <div class='cell d-4'></div>
        <div class='cell d-2'></div>
        <div class='cell d-3'></div>
        <div class='cell d-4'></div>
        <div class='cell d-5'></div>
        <div class='cell d-3'></div>
        <div class='cell d-4'></div>
        <div class='cell d-5'></div>
        <div class='cell d-6'></div>
      </div>
    </div>
  `,
};

class StaticTemplateElement extends HTMLElement {
  connectedCallback() {
    if (this.dataset.rendered === "true") {
      return;
    }

    this.dataset.rendered = "true";
    this.innerHTML = this.template;
  }
}

class AddToyFormElement extends StaticTemplateElement {
  template = templates.addToyForm;
}

class TopActionElement extends StaticTemplateElement {
  template = templates.topAction;
}

class ModalConfirmElement extends StaticTemplateElement {
  template = templates.modalConfirm;
}

class MosaicLoaderElement extends StaticTemplateElement {
  template = templates.mosaicLoader;
}

function defineComponent(tagName, elementClass) {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, elementClass);
  }
}

export async function registerComponents() {
  defineComponent("add-toy-form", AddToyFormElement);
  defineComponent("top-action", TopActionElement);
  defineComponent("modal-confirm", ModalConfirmElement);
  defineComponent("mosaic-loader", MosaicLoaderElement);

  await Promise.all([
    customElements.whenDefined("add-toy-form"),
    customElements.whenDefined("top-action"),
    customElements.whenDefined("modal-confirm"),
    customElements.whenDefined("mosaic-loader"),
  ]);
}