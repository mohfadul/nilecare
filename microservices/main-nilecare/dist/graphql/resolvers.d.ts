/**
 * GraphQL Resolvers
 * Phase 3: Maps GraphQL queries to REST API calls
 */
export interface GraphQLContext {
    req: any;
    proxyToService: Function;
    cache: any;
}
export declare const resolvers: {
    Query: {
        patient: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<any>;
        patients: (_: any, { limit, offset }: {
            limit?: number;
            offset?: number;
        }, context: GraphQLContext) => Promise<{
            patients: any;
            total: any;
            page: any;
            limit: any;
        }>;
        appointment: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<any>;
        appointments: (_: any, args: any, context: GraphQLContext) => Promise<any>;
        medications: (_: any, args: any, context: GraphQLContext) => Promise<any>;
        labOrders: (_: any, args: any, context: GraphQLContext) => Promise<any>;
        invoice: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<any>;
        invoices: (_: any, args: any, context: GraphQLContext) => Promise<any>;
        payment: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<any>;
        payments: (_: any, args: any, context: GraphQLContext) => Promise<any>;
        paymentStats: (_: any, args: any, context: GraphQLContext) => Promise<any>;
        pendingVerifications: (_: any, args: any, context: GraphQLContext) => Promise<any>;
        refund: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<any>;
        refunds: (_: any, args: any, context: GraphQLContext) => Promise<any>;
    };
    Mutation: {
        createPatient: (_: any, { input }: any, context: GraphQLContext) => Promise<any>;
        updatePatient: (_: any, { id, input }: any, context: GraphQLContext) => Promise<any>;
        deletePatient: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<{
            success: boolean;
            message: string;
        }>;
        createAppointment: (_: any, { input }: any, context: GraphQLContext) => Promise<any>;
        updateAppointment: (_: any, { id, input }: any, context: GraphQLContext) => Promise<any>;
        cancelAppointment: (_: any, { id }: {
            id: string;
        }, context: GraphQLContext) => Promise<any>;
        initiatePayment: (_: any, { input }: any, context: GraphQLContext) => Promise<any>;
        verifyPayment: (_: any, { input }: any, context: GraphQLContext) => Promise<any>;
        cancelPayment: (_: any, { id, reason }: {
            id: string;
            reason: string;
        }, context: GraphQLContext) => Promise<any>;
        requestRefund: (_: any, { input }: any, context: GraphQLContext) => Promise<any>;
    };
    Patient: {
        appointments: (parent: any, _: any, context: GraphQLContext) => Promise<any>;
        medications: (parent: any, _: any, context: GraphQLContext) => Promise<any>;
        labOrders: (parent: any, _: any, context: GraphQLContext) => Promise<any>;
    };
};
export default resolvers;
//# sourceMappingURL=resolvers.d.ts.map