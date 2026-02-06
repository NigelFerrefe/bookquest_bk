# BookQuest API

REST API for managing books, authors, genres, and users, featuring JWT-based authentication and Cloudinary image uploads.

## Technologies Used

- Node.js + Express
- MongoDB + Mongoose
- Zod for data validation
- JWT for authentication
- Cloudinary for image management
- Custom middleware for authentication and error handling

---

## Routes and Endpoints

### Auth (`/auth`)

- **POST /auth/signup**  
  Create a new user  
  Body: `{ email, password, name }`

- **POST /auth/login**  
  User login  
  Body: `{ email, password }`

- **POST /auth/logout**  
  Logout user 

---

### User (`/user`)

- **GET /user/:userId**  
  Get user profile (password excluded)  
  Header: `Authorization: Bearer <token>`

- **PUT /user/:userId**  
  Update user profile (admin role required)  
  Header: `Authorization: Bearer <token>`  
  Body: fields to update (email, name, role, etc.)

---

### Author (`/author`)

- **POST /author**  
  Create a new author  
  Header: `Authorization: Bearer <token>`  
  Body: `{ name, bio, ... }`

- **GET /author**  
  List all authors

- **GET /author/:authorId/books**  
  List all books from an author

- **PUT /author/:authorId**  
  Update author  
  Header: `Authorization: Bearer <token>`  
  Body: fields to update

- **DELETE /author/:authorId**  
  Delete author  
  Header: `Authorization: Bearer <token>`

---

### Genre (`/genre`)

- **POST /genre**  
  Create a new genre  
  Header: `Authorization: Bearer <token>`  
  Body: `{ name, description }`

- **GET /genre**  
  List all genres

- **GET /genre/:genreId/books**  
  List all books from a genre

- **PUT /genre/:genreId**  
  Update genre  
  Header: `Authorization: Bearer <token>`  
  Body: fields to update

- **DELETE /genre/:genreId**  
  Delete genre  
  Header: `Authorization: Bearer <token>`

---

### Book (`/book`)

- **POST /book**  
  Create a new book (supports Cloudinary image upload)  
  Header: `Authorization: Bearer <token>`  
  Body: `{ title, author, genre, description, price, isBought, isFavorite, imageUrl }`

- **GET /book/:bookId**  
  Get book details

- **PUT /book/:bookId**  
  Update book (supports image upload/update)  
  Header: `Authorization: Bearer <token>`  
  Body: fields to update

- **DELETE /book/:bookId**  
  Delete book  
  Header: `Authorization: Bearer <token>`

---

### Book Lists (`/books-lists`)

User book lists with pagination (10 items per page)

- **GET /books-lists/wishlist**  
  Get wishlist books  
  Query params: `?page=1`  
  Header: `Authorization: Bearer <token>`

- **GET /books-lists/favorites**  
  Get favorite books  
  Query params: `?page=1`  
  Header: `Authorization: Bearer <token>`

- **GET /books-lists/purchased**  
  Get purchased books  
  Query params: `?page=1`  
  Header: `Authorization: Bearer <token>`

---

### Google Books (`/google-books`)

Search books from Google Books API filtered for Spanish and Catalan books with Spanish ISBNs

- **GET /google-books**  
  Search books from Google Books API  
  Query params: `?q=search_term&page=1&limit=10`  
  - `q` (required): Search term (title or author)
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Items per page, 1-40 (default: 10)  
  
  Response includes:
  - Paginated book results
  - Language statistics (Spanish/Catalan)
  - ISBN filters (978-84, 979-13)
  - Book details: ISBN-13, title, authors, image, categories, description, price, language

- **GET /google-books/:isbn13**  
  Get book details by ISBN-13  
  Params: `isbn13` - ISBN-13 from Spain (978-84 or 979-13, hyphens allowed)  
  
  Returns:
  - Single book details
  - Only Spanish or Catalan books
  - Only books with Spanish ISBNs

- **POST /google-books/:isbn13/add-to-wishlist**  
  Add a book from Google Books to user's wishlist  
  Header: `Authorization: Bearer <token>`  
  Params: `isbn13` - ISBN-13 from Spain (978-84 or 979-13, hyphens allowed)  
  
  Process:
  - Fetches book from Google Books API
  - Validates Spanish/Catalan language and Spanish ISBN
  - Checks for duplicates in user's wishlist
  - Creates author and genres if they don't exist
  - Creates book in database linked to user
  - Returns created book with populated author and genres

---

## Validation

All inputs are validated with [Zod], ensuring data integrity and type safety in the routes.

---

## Middleware

- **Auth middleware:** validates JWT tokens on protected routes  
- **Error handling:** centralized error management for clear responses

---

## Image Uploads

Book images are managed via Cloudinary. The `POST /book` and `PUT /book/:id` routes support uploads via `multer` and save the resulting image URL.

---

## API Version
v1.0.0 (stable)

---

## Final Notes

- The API is designed for personal use with just two users, so the user system is simple.   
- Role control is basic, with middleware protecting admin routes.  
- Passwords are securely stored with bcrypt.

---

If you have any questions or want to contribute, feel free to open issues or pull requests.

Thank you for using BookQuest API! 📚🚀
