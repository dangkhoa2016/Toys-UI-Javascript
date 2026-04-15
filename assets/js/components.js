const templates = {
  addToyForm: `
    <div id='modal-add-toy' class='modal fade' tabindex='-1' aria-labelledby='modal-add-toy-title' aria-hidden='true'>
      <div class='modal-dialog modal-dialog-centered modal-lg'>
        <div class='modal-content toy-modal-content border-0'>
          <div class='modal-header border-0 pb-0'>
            <div>
              <p class='toy-modal-eyebrow mb-2'>Toy workshop</p>
              <h2 id='modal-add-toy-title' class='h3 mb-1'>Create a new toy</h2>
              <p class='text-muted mb-0'>Add a character with a name and an image URL, then send it straight to Andy's shelf.</p>
            </div>
            <button type='button' class='btn-close' data-bs-dismiss='modal' aria-label='Close'></button>
          </div>

          <div class='modal-body pt-3'>
            <form id='add-toy-form' class='text-start'>
              <div class='card toy-form-card border-0 shadow-sm mx-auto'>
                <div class='card-body p-4 p-md-4'>
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
          </div>
        </div>
      </div>
    </div>
  `,
  editToyForm: `
    <div id='modal-edit-toy' class='modal fade' tabindex='-1' aria-labelledby='modal-edit-toy-title' aria-hidden='true'>
      <div class='modal-dialog modal-dialog-centered modal-lg'>
        <div class='modal-content toy-modal-content border-0'>
          <div class='modal-header border-0 pb-0'>
            <div>
              <p class='toy-modal-eyebrow mb-2'>Shelf maintenance</p>
              <h2 id='modal-edit-toy-title' class='h3 mb-1'>Edit toy details</h2>
              <p class='text-muted mb-0'>Update the selected toy without resetting its current likes.</p>
            </div>
            <button type='button' class='btn-close' data-bs-dismiss='modal' aria-label='Close'></button>
          </div>

          <div class='modal-body pt-3'>
            <form id='edit-toy-form' class='text-start'>
              <div class='card toy-form-card border-0 shadow-sm mx-auto'>
                <div class='card-body p-4 p-md-4'>
                  <div class='row g-3'>
                    <div class='col-12'>
                      <p class='form-text toy-form-hint my-0'>Editing <span class='toy-edit-info fw-semibold'>the selected toy</span></p>
                    </div>

                    <div class='col-12 col-md-6'>
                      <label for='edit-toy-name' class='form-label'>Toy name</label>
                      <input
                        id='edit-toy-name'
                        type='text'
                        name='name'
                        value=''
                        placeholder="Update the toy's name..."
                        class='form-control'
                        autocomplete='off'
                      />
                    </div>

                    <div class='col-12 col-md-6'>
                      <label for='edit-toy-image' class='form-label'>Image URL</label>
                      <input
                        id='edit-toy-image'
                        type='text'
                        name='image'
                        value=''
                        placeholder="Update the toy's image URL..."
                        class='form-control'
                        autocomplete='off'
                      />
                    </div>

                    <div class='col-12 toy-form-actions d-flex flex-column flex-md-row align-items-stretch align-items-md-center gap-2 gap-md-3'>
                      <button type='submit' name='submit' class='btn btn-primary px-4 toy-form-submit'>Save Changes</button>
                      <span class='form-text toy-form-hint my-0'>Changes are sent to the API immediately after you save.</span>
                    </div>

                    <div class='col-12'>
                      <div role='alert' class='alert alert-danger d-none mb-0'></div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  topAction: `
    <section class='toy-controls-shell'>
      <div class='toy-controls card border-0 shadow-sm'>
        <div class='card-body p-3 p-lg-4'>
          <div class='row g-4 align-items-xl-end'>
            <div class='col-12 col-xl-4'>
              <div class='toy-controls-copy h-100 d-flex flex-column justify-content-center'>
              <p class='toy-controls-eyebrow mb-2'>Toy Tale control room</p>
              <h2 class='h4 mb-2'>Andy needs your help</h2>
              <p class='text-muted mb-0'>Create new toys, search the shelf instantly, or reorder the collection by likes.</p>
              </div>
            </div>

            <div class='col-12 col-xl-8'>
              <div class='row g-3 align-items-end'>
                <div class='col-12 col-md-6 col-lg-5'>
                  <label class='toy-field h-100 d-flex flex-column'>
                    <span class='toy-field-label'>Search by name</span>
                    <input
                      id='toy-search'
                      type='search'
                      class='form-control toy-control-input'
                      placeholder='Type a toy name...'
                      autocomplete='off'
                    />
                  </label>
                </div>

                <div class='col-12 col-md-6 col-lg-4'>
                  <label class='toy-field h-100 d-flex flex-column'>
                    <span class='toy-field-label'>Sort by likes</span>
                    <select id='toy-sort' class='form-select toy-control-input'>
                      <option value='default'>Default order</option>
                      <option value='likes-desc'>Most liked first</option>
                      <option value='likes-asc'>Least liked first</option>
                    </select>
                  </label>
                </div>

                <div class='col-12 col-lg-3 d-grid'>
                  <button class='btn btn-primary toy-create-trigger w-100' id='new-toy-btn' type='button'>Add a new toy!</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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

class EditToyFormElement extends StaticTemplateElement {
  template = templates.editToyForm;
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
  defineComponent("edit-toy-form", EditToyFormElement);
  defineComponent("top-action", TopActionElement);
  defineComponent("modal-confirm", ModalConfirmElement);
  defineComponent("mosaic-loader", MosaicLoaderElement);

  await Promise.all([
    customElements.whenDefined("add-toy-form"),
    customElements.whenDefined("edit-toy-form"),
    customElements.whenDefined("top-action"),
    customElements.whenDefined("modal-confirm"),
    customElements.whenDefined("mosaic-loader"),
  ]);
}