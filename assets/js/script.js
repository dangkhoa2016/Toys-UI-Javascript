(async () => {

  const url = 'https://Toy-Api-Server-Nodejs.khoa2016.repl.co/api/toys';
  let confirmDeleteToyId = '';

  const sleep = function (ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
  };

  const loadHtml = function (file) {
    return new Promise((resolve) => {
      fetch(file)
        .then(res => {
          if (res.status !== 200)
            throw new Error(`File [${file}] does not exists.`);
          return res.text();
        }).then(html => { resolve(html); })
        .catch(ex => {
          console.log(`Error load html: ${file}`, ex);
          resolve();
        });
    });
  };

  function renderToy(toy) {
    const body = `
    <div class="card">
      <img src="${toy.image}" alt="${toy.name}" class="my-1" />
      <div class="card-body">
        <h5 class="card-title">${toy.name}</h5>
        <p class="card-text"><span>${toy.likes}</span> likes</p>
        <div>
          <button class="btn btn-success like-btn">Like &lt;3</button>
          <button class="btn btn-danger delete-btn">Delete</button>
        </div>
      </div>
    </div>
    `;

    const outerDiv = document.createElement('div');
    outerDiv.className = 'col';
    outerDiv.innerHTML = body;
    outerDiv.setAttribute('data-id', toy.id);

    toyCollectionDiv.append(outerDiv);
    bindHandleClick(outerDiv, toy);
  };

  function bindHandleClick(outerDiv, toy) {
    const likeButton = outerDiv.querySelector('.card .like-btn');
    const deleteButton = outerDiv.querySelector('.card .delete-btn');
    const likeSpan = outerDiv.querySelector('.card p > span');

    likeButton.addEventListener('click', (e) => {
      handleLike(toy, likeSpan);
    });

    deleteButton.addEventListener('click', (e) => {
      confirmDeleteToyId = toy.id;
      modalConfirm._element.querySelector('.toy-info').innerText = `[${toy.id}] [${toy.name}]`;
      modalConfirm.show();
    });
  };

  function handleLike(toy, likeSpan) {
    fetch(`${url}/${toy.id}/likes`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'Application/json',
        'Accept': 'Application/json'
      },
      body: JSON.stringify({
        likes: toy.likes + 1
      })
    })
      .then(r => r.json())
      .then(updatedToy => {
        toy.likes = updatedToy.likes;
        likeSpan.innerText = toy.likes;
      })
  };

  function handleDelete() {
    fetch(`${url}/${confirmDeleteToyId}`, {
      method: 'DELETE'
    }).then(r => r.json())
      .then((deletedResult) => {
        console.log('deletedResult', deletedResult);
        document.querySelector(`[data-id="${confirmDeleteToyId}"]`).remove();
        modalConfirm.hide();
      });
  };

  async function importDemo() {
    const response = await fetch('/assets/db.json');
    const toys = (await response.json()).toys;
    await Promise.all(toys.map(async toy => {
      const options = { method: 'post', body: JSON.stringify(toy), headers: { 'content-type': 'application/json' } };
      await fetch(url, options);
    }));
  };

  async function fetchAndRender() {
    loaderDiv.classList.replace('d-none', 'd-block');
    // await sleep(5000);

    let response = await fetch(url);
    let allToys = await response.json();
    if (Array.isArray(allToys) === false || allToys.length === 0) {
      await importDemo();
      response = await fetch(url);
      allToys = await response.json();
    }

    if (Array.isArray(allToys) && allToys.length > 0)
      allToys.forEach(renderToy);
    else
      console.log('No toys data.');

    loaderDiv.classList.replace('d-block', 'd-none');
  };

  async function loadAndRenderParts() {
    const arr = ['add-toy-form', 'top-action', 'modal-confirm', 'mosaic-loader'];
    await Promise.all(arr.map(async item => {
      const element = document.querySelector(item);
      if (element) {
        try {
          let content = await loadHtml(`/assets/parts/${item}.html`);
          content = htmlToElement(content);
          element.parentNode.replaceChild(content, element);
        } catch (error) {
          console.log(`Error load ${item}`, error);
        }
      }
    }));
  }

  async function main() {

    window.addEventListener('scroll', function (e) {
      if (window.scrollY > 300)
        toTopA.classList.replace('d-none', 'd-block');
      else
        toTopA.classList.replace('d-block', 'd-none');
    });


    let addToy = false;
    const addBtn = document.querySelector('#new-toy-btn');
    const toTopA = document.querySelector('#to-top');
    const toyForm = document.querySelector('#add-toy-form');

    addBtn.addEventListener('click', () => {
      addToy = !addToy;
      if (addToy)
        toyForm.classList.replace('d-none', 'd-block');
      else
        toyForm.classList.replace('d-block', 'd-none');
    });

    toyForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const form = event.target;
      const name = form.name.value;
      const image = form.image.value;
      const alertDiv = form.querySelector('.alert');
      alertDiv.classList.replace('d-block', 'd-none');
      loaderDiv.classList.replace('d-none', 'd-block');

      try {
        const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify({
            name: name,
            image: image,
            likes: 0,
          }),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        const result = response.json();

        if (result.id) {
          render(result);
          event.target.reset();
        } else {
          // console.log(response);
          alertDiv.classList.replace('d-none', 'd-block');
        }

        loaderDiv.classList.replace('d-block', 'd-none');
      } catch (ex) {
        console.log('Error create new toy', ex);
        alertDiv.classList.replace('d-none', 'd-block');
        loaderDiv.classList.replace('d-block', 'd-none');
      };
    });

    toTopA.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo(0, 0);
    });

    modalConfirm._element.querySelector('.btn-confirm').addEventListener('click', handleDelete);

  };

  await loadAndRenderParts();

  const toyCollectionDiv = document.querySelector('#toy-collection');
  const loaderDiv = document.querySelector('.loader');
  const modalConfirm = new bootstrap.Modal(document.querySelector('#modal-delete-toy'));

  main();
  await fetchAndRender();

})();
