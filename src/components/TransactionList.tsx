import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2, Loader2 } from "lucide-react";
import * as Icons from "lucide-react";

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

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  loading: boolean;
  formatCurrency: (amount: number) => string;
}

export function TransactionList({ 
  transactions, 
  onEdit, 
  onDelete, 
  loading, 
  formatCurrency 
}: TransactionListProps) {
  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <Icons.Circle className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-2">Nenhuma transação encontrada</div>
        <p className="text-sm text-muted-foreground">
          Adicione sua primeira transação clicando no botão "Nova Transação"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="flex items-center justify-between p-4 rounded-lg border bg-card shadow-soft transition-fast hover:shadow-medium"
        >
          <div className="flex items-center gap-3 flex-1">
            {/* Category Icon */}
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${transaction.categories.color}15` }}
            >
              <div style={{ color: transaction.categories.color }}>
                {getIcon(transaction.categories.icon)}
              </div>
            </div>

            {/* Transaction Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-foreground truncate">
                  {transaction.description || transaction.categories.name}
                </span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    transaction.type === 'income' 
                      ? 'bg-income-light text-income' 
                      : 'bg-expense-light text-expense'
                  }`}
                >
                  {transaction.categories.name}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(transaction.date)}
              </div>
            </div>

            {/* Amount */}
            <div className="text-right">
              <div 
                className={`font-bold text-lg ${
                  transaction.type === 'income' ? 'text-income' : 'text-expense'
                }`}
              >
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(transaction)}
              className="h-8 w-8"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(transaction.id)}
              className="h-8 w-8 text-expense hover:text-expense"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}