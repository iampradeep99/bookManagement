function fetchBooks() {
  fetch('/books/allbooks')
    .then(response => response.json())
    .then(books => {
      const bookList = document.getElementById('bookList');
      bookList.innerHTML = '';

      books.forEach(book => {
          const bookRow = document.createElement('div');
          bookRow.classList.add('book-row');
          bookRow.id = `book-${book._id}`;

          const bookInfo = document.createElement('div');
          bookInfo.classList.add('book-info');
          bookInfo.innerHTML = `${book.title} by ${book.author} (Published: ${book.publishedYear}) - Genre: ${book.genre}`;

          const viewButton = document.createElement('button');
          viewButton.innerText = 'View';
          viewButton.onclick = () => viewBook(book._id);

          const deleteButton = document.createElement('button');
          deleteButton.innerText = 'Delete';
          deleteButton.classList.add('delete');
          deleteButton.onclick = () => deleteBook(book._id);

          bookRow.appendChild(bookInfo);
          bookRow.appendChild(viewButton);
          bookRow.appendChild(deleteButton);

          bookList.appendChild(bookRow);
      });
    })
    .catch(error => console.error('Error fetching books:', error));
}

document.getElementById('addBookForm').addEventListener('submit', (event) => {
  event.preventDefault();

  const newBook = {
    title: document.getElementById('title').value,
    author: document.getElementById('author').value,
    publishedYear: parseInt(document.getElementById('publishedYear').value),
    genre: document.getElementById('genre').value,
  };

  fetch('/books/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newBook),
  })
    .then(response => response.json())
    .then(book => {
      fetchBooks();
    })
    .catch(error => console.error('Error adding book:', error));
});

async function deleteBook(bookId) {
  fetch(`/books/${bookId}`, {
    method: 'DELETE',
  })
    .then(async(response) => {
      if (response.ok) {
        await fetchBooks();
      } else {
        console.error('Error deleting book');
      }
    })
    .catch(error => console.error('Error deleting book:', error));
}

function removeBookFromList(bookId) {
  const bookRow = document.getElementById(`book-${bookId}`);
  if (bookRow) {
      bookRow.remove();
  }
}

function viewBook(id) {
  fetch(`/books/${id}`)
    .then(response => response.json())
    .then(book => {
      alert(`Book details:\nTitle: ${book.title}\nAuthor: ${book.author}\nYear: ${book.publishedYear}\nGenre: ${book.genre}`);
    })
    .catch(error => console.error('Error fetching book:', error));
}

window.onload = fetchBooks;
