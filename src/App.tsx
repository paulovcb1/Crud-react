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
      
      
      console.log('startDate:', startDate);
      console.log('endDate:', endDate);
  
      
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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Controle de Despesas</h1>
            <button
              onClick={() => setIsAddingExpense(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus size={20} /> Nova Despesa
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mês</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Categoria</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Todas</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(expense.date), 'dd/MM/yyyy')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R$ {expense.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setEditingExpense(expense);
                            setFormData(expense);
                            setIsAddingExpense(true);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Pencil size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">Total</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">R$ {totalExpenses.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>

      {isAddingExpense && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{editingExpense ? 'Editar Despesa' : 'Nova Despesa'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.amount}
                  onChange={(e) => {const value = e.target.value ? parseFloat(e.target.value) : 0 
                      setFormData({ ...formData, amount: value})
                  }} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Descrição</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Data</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Categoria</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingExpense(false);
                    setEditingExpense(null);
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  {editingExpense ? 'Salvar' : 'Adicionar'}
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