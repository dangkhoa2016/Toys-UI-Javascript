const templates = {
  addToyForm: `
    <form id='add-toy-form' class='d-none mx-auto mt-4 text-start'>
      <div class='card toy-form-card border-0 shadow-sm mx-auto'>
        <div class='card-body p-4 p-md-4'>
          <div class='mb-3'>
            <h3 class='h4 mb-1'>Create a toy</h3>
            <p class='text-muted mb-0'>Add a new character with a name and an image URL.</p>
          </div>

          <div class='row g-3'>
            <div class='col-12 col-md-6'>
              <label for='toy-name' class='form-label'>Toy name</label>
              <input
                id='toy-name'
                type='text'
                name='name'
                value=''
                placeholder="Enter a toy's name..."
                class='form-control'
                autocomplete='off'
              />
            </div>

            <div class='col-12 col-md-6'>
              <label for='toy-image' class='form-label'>Image URL</label>
              <input
                id='toy-image'
                type='text'
                name='image'
                value=''
                placeholder="Enter a toy's image URL..."
                class='form-control'
                autocomplete='off'
              />
            </div>

            <div class='col-12 toy-form-actions d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-2 gap-md-3'>
              <button type='submit' name='submit' class='btn btn-danger px-4 toy-form-submit'>Create New Toy</button>
              <span class='form-text toy-form-hint my-0'>Use a valid image URL so the toy card renders correctly.</span>
            </div>

            <div class='col-12'>
              <div role='alert' class='alert alert-danger d-none mb-0'></div>
            </div>
          </div>
        </div>
      </div>
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