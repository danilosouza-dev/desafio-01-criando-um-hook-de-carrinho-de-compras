import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { createTextChangeRange } from 'typescript';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {

    try {
      const updatedCart = [...cart]
      const productExists = updatedCart.find(product => product.id === productId);
      const stock = await api.get(`/stock/${productId}`);

      const stockAmount = stock.data.amount;
      const currentAmount = productExists ? productExists.amount : 0;
      const spactedAmount = currentAmount + 1;

      if (spactedAmount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return
        // const { data: product } = await api.get<Product>(`/products/${productId}`);

        // if (stock.amount > 0) {
        //   setCart([...cart, { ...product, amount: 1 }]);
        //   localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, { ...product, amount: 1 }]));
        //   toast('Adicionado');
        //   return
        // }
      }

      if (productExists) {
        productExists.amount = spactedAmount;
      } else {
        const product = await api.get(`products/${productId}`);
        const newProduct = {
          ...product.data,
          amount: 1
        }
        updatedCart.push(newProduct);
      }
      setCart(updatedCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      toast.success('Adicionado!');

      // else {
      //   const { data: stock } = await api.get<Stock>(`/stock/${productId}`);
      //   if (stock.amount > productAreadyInCart.amount) {
      //     productAreadyInCart.amount += 1
      //     localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, productAreadyInCart.amount]));

      //   } else {
      //   }

      // }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart];
      const producIndex = updatedCart.findIndex(product => product.id === productId);

      if (producIndex >= 0) {
        updatedCart.splice(producIndex, 1);
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const updatedCart = [...cart];
      const productExists = updatedCart.find(product => product.id === productId);
      const stock = await api.get(`stock/${productId}`);

      const stockAmount = stock.data.amount;

      if (amount <= 0 ) {
        return;
      }

      if (amount > stockAmount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if (productExists) {
        productExists.amount = amount;
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
      } else {
        throw Error();
      }
      

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
