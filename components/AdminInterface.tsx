
interface AdminProps {
    drivers: Driver[];
    orders: Order[];
    vales: Vale[];
    expenses: Expense[];
    products: Product[];
    clients: Client[];
    settlements: Settlement[];
    suppliers: Supplier[];
    inventory: InventoryItem[];
    shoppingList: ShoppingItem[];
    giveawayEntries: GiveawayEntry[];
    appConfig: AppConfig;
    isMobile: boolean;
    setModal: (modal: any) => void;
    setModalData: (data: any) => void;
    onLogout: () => void;
    onDeleteOrder: (id: string) => void;
    onAssignOrder: (oid: string, did: string) => void;
    setDriverToEdit: (driver: Driver | null) => void;
    onDeleteDriver: (id: string) => void;
    setClientToEdit: (client: Client | null) => void;
    onUpdateOrder: (id: string, data: any) => void;
    onCreateOrder: (data: any) => void;
    onCreateDriver: (data: any) => void;
    onUpdateDriver: (id: string, data: any) => void;
    onCreateVale: (data: any) => void;
    onCreateExpense: (data: any) => void;
    onCreateProduct: (data: any) => void;
    onDeleteProduct: (id: string) => void;
    onUpdateProduct: (id: string, data: any) => void;
    onUpdateClient: (id: string, data: any) => void;
    onCloseCycle: (driverId: string, data: any) => void;
    onCreateSupplier: (data: any) => void;
    onUpdateSupplier: (id: string, data: any) => void;
    onDeleteSupplier: (id: string) => void;
    onCreateInventory: (data: any) => void;
    onUpdateInventory: (id: string, data: any) => void;
    onDeleteInventory: (id: string) => void;
    onAddShoppingItem: (name: string) => void;
    onToggleShoppingItem: (id: string, currentVal: boolean) => void;
    onDeleteShoppingItem: (id: string) => void;
    onClearShoppingList: () => void;
    setAppConfig: (config: AppConfig) => void;
    onUpdateGiveawayEntry?: (id: string, data: any) => void; // Added for giveaway confirmation
    onDeleteGiveawayEntry?: (id: string) => void; // Added for deletion
    modal: any;
    modalData: any; 
}

// ... existing imports and components ...

// No final do arquivo, no bloco de renderização do componente AdminInterface:

            {/* MODAL DE RESPOSTA AO SORTEIO - AGORA ACIONADO DIRETAMENTE */}
            {giveawayToRespond && (
                <GiveawayResponseModal 
                    entry={giveawayToRespond}
                    onClose={() => setGiveawayToRespond(null)}
                    appConfig={props.appConfig}
                />
            )}

            {/* MODAL DE GERENCIAMENTO DE SORTEIO */}
            {props.modal === 'giveawayManager' && (
                <GiveawayManagerModal 
                    entries={props.giveawayEntries}
                    onClose={() => props.setModal(null)}
                    appConfig={props.appConfig}
                    onUpdateEntry={props.onUpdateGiveawayEntry}
                    onDeleteEntry={props.onDeleteGiveawayEntry}
                />
            )}
        </div>
    );
}
