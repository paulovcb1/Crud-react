import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Expense, NewExpense, CATEGORIES } from './types/expense';

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<NewExpense>({
    amount: 0,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    category: 'Outros'
  });

  useEffect(() => {
    fetchExpenses();
  }, [selectedMonth, selectedCategory]);

  async function fetchExpenses() {
    try {

      const [year, month] = selectedMonth.split('-');


      const expensesRef = collection(db, 'expenses');


      const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, 1)); // 1º dia do mês
      const endDate = new Date(Date.UTC(Number(year), Number(month), 0, 23, 59, 59)); // Último dia do mês


      // console.log('startDate:', startDate);
      // console.log('endDate:', endDate);


      let q = query(
        expensesRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      );


      if (selectedCategory) {
        q = query(q, where('category', '==', selectedCategory));
      }


      const querySnapshot = await getDocs(q);
      console.log('Documentos retornados:', querySnapshot.size);


      const expensesData: Expense[] = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          amount: Number(data.amount),
          description: data.description || '',
          category: data.category || 'Outros',
          date: data.date instanceof Timestamp ? format(data.date.toDate(), 'yyyy-MM-dd') : data.date,
          created_at: data.created_at instanceof Timestamp ? format(data.created_at.toDate(), 'yyyy-MM-dd HH:mm:ss') : data.created_at
        };
      });

      setExpenses(expensesData);

    } catch (error) {
      console.error('Erro ao buscar despesas:', error);
    }
  }



  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingExpense) {
        const expenseRef = doc(db, 'expenses', editingExpense.id);
        await updateDoc(expenseRef, {
          ...formData,
          date: Timestamp.fromDate(new Date(formData.date)),
          updated_at: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, 'expenses'), {
          ...formData,
          date: Timestamp.fromDate(new Date(formData.date)),
          created_at: Timestamp.now()
        });
      }

      setFormData({
        amount: 0,
        description: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        category: 'Outros'
      });
      setIsAddingExpense(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDoc(doc(db, 'expenses', id));
      fetchExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans">
      <div className="max-w-4xl mx-auto py-10 px-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-semibold">Controle de Despesas</h1>
          <button
            onClick={() => setIsAddingExpense(true)}
            className="bg-[#007AFF] text-white px-5 py-2 rounded-xl shadow-md flex items-center gap-2 hover:bg-[#0066CC] transition"
          >
            <Plus size={20} /> Nova Despesa
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium">Mês</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#007AFF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Categoria</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#007AFF] focus:outline-none"
              >
                <option value="">Todas</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl shadow">
            <table className="w-full bg-white rounded-xl">
              <thead className="bg-[#f5f5f7] text-[#1d1d1f]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium">Data</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Descrição</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Categoria</th>
                  <th className="px-6 py-3 text-left text-sm font-medium">Valor</th>
                  <th className="px-6 py-3 text-right text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b hover:bg-gray-100">
                    <td className="px-6 py-4">{format(new Date(expense.date), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4">{expense.description}</td>
                    <td className="px-6 py-4">{expense.category}</td>
                    <td className="px-6 py-4">R$ {expense.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setEditingExpense(expense); setFormData(expense); setIsAddingExpense(true); }} className="text-[#007AFF] hover:text-[#005BB5] mr-4">
                        <Pencil size={20} />
                      </button>
                      <button onClick={() => handleDelete(expense.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}

                <tr>
                  <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Total</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">R$ {totalExpenses.toFixed(2)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isAddingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-semibold mb-4">{formData.id ? 'Editar Despesa' : 'Nova Despesa'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#007AFF] focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Descrição</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#007AFF] focus:outline-none"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Data</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#007AFF] focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsAddingExpense(false)}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#007AFF] text-white px-4 py-2 rounded-lg hover:bg-[#005BB5]"
                >
                  {formData.id ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;