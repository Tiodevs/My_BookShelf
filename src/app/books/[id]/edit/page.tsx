import { notFound } from 'next/navigation';
import EditBookForm from '@/components/edit-book-form';
import { getBookById } from '@/actions/book'; // Assuming getBookById exists or will be created

export default async function EditBookPage({ params }: { params: { id: string } }) {
  const book = await getBookById(params.id);

  if (!book) {
    notFound();
  }

  return (
    <main className="min-h-screen p-8 md:p-12 lg:p-24">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold mb-8">Editar Livro: {book.title}</h1>
        <EditBookForm book={book} />
      </div>
    </main>
  );
}
