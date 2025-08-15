import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, TrendingDown, DollarSign, Wallet } from "lucide-react";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import { FilterBar } from "./FilterBar";

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  category_id: string;
  categories: {
    name: string;
    icon: string;
    color: string;
  };
}

interface Summary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    categoryId: '',
    type: '' as '' | 'income' | 'expense'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    if (!user) return;

    setLoading(true);
    let query = supabase
      .from('transactions')
      .select(`
        *,
        categories (
          name,
          icon,
          color
        )
      `)
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    // Apply filters
    if (filters.dateFrom) {
      query = query.gte('date', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('date', filters.dateTo);
    }
    if (filters.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }
    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
    } else {
      const transactionData = (data || []) as Transaction[];
      setTransactions(transactionData);
      calculateSummary(transactionData);
    }
    setLoading(false);
  };

  const calculateSummary = (transactionData: Transaction[]) => {
    const totalIncome = transactionData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const totalExpense = transactionData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    setSummary({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense
    });
  };

  const handleTransactionSuccess = () => {
    fetchTransactions();
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchTransactions();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Olá, {user?.user_metadata?.full_name || 'Usuário'}! 👋
            </h1>
            <p className="text-muted-foreground">
              Aqui está o resumo das suas finanças
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsFormOpen(true)} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Nova Transação
            </Button>
            <Button variant="outline" onClick={signOut}>
              Sair
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                {formatCurrency(summary.balance)}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.balance >= 0 ? '+' : ''}{((summary.balance / (summary.totalIncome || 1)) * 100).toFixed(1)}% do total de receitas
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <div className="p-2 rounded-lg bg-income-light">
                <TrendingUp className="h-4 w-4 text-income" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-income">
                {formatCurrency(summary.totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground">
                {transactions.filter(t => t.type === 'income').length} transações
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <div className="p-2 rounded-lg bg-expense-light">
                <TrendingDown className="h-4 w-4 text-expense" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-expense">
                {formatCurrency(summary.totalExpense)}
              </div>
              <p className="text-xs text-muted-foreground">
                {transactions.filter(t => t.type === 'expense').length} transações
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-medium">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Economia</CardTitle>
              <div className="p-2 rounded-lg bg-neutral-light">
                <DollarSign className="h-4 w-4 text-neutral" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {summary.totalIncome > 0 ? ((summary.balance / summary.totalIncome) * 100).toFixed(1) : '0.0'}%
              </div>
              <p className="text-xs text-muted-foreground">
                Do total de receitas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} onFiltersChange={setFilters} />

        {/* Transactions */}
        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>Últimas Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionList 
              transactions={transactions}
              onEdit={handleEdit}
              onDelete={handleDelete}
              loading={loading}
              formatCurrency={formatCurrency}
            />
          </CardContent>
        </Card>

        {/* Transaction Form Modal */}
        {isFormOpen && (
          <TransactionForm
            transaction={editingTransaction}
            onSuccess={handleTransactionSuccess}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingTransaction(null);
            }}
          />
        )}
      </div>
    </div>
  );
}