"use strict";
/**
 * Reconciliation Entity
 * Represents payment reconciliation with bank statements
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReconciliationEntity = exports.ResolutionAction = exports.DiscrepancyType = exports.ReconciliationStatus = void 0;
var ReconciliationStatus;
(function (ReconciliationStatus) {
    ReconciliationStatus["PENDING"] = "pending";
    ReconciliationStatus["MATCHED"] = "matched";
    ReconciliationStatus["MISMATCH"] = "mismatch";
    ReconciliationStatus["INVESTIGATING"] = "investigating";
    ReconciliationStatus["RESOLVED"] = "resolved";
    ReconciliationStatus["WRITTEN_OFF"] = "written_off";
})(ReconciliationStatus || (exports.ReconciliationStatus = ReconciliationStatus = {}));
var DiscrepancyType;
(function (DiscrepancyType) {
    DiscrepancyType["AMOUNT"] = "amount";
    DiscrepancyType["TIMING"] = "timing";
    DiscrepancyType["MISSING"] = "missing";
    DiscrepancyType["DUPLICATE"] = "duplicate";
    DiscrepancyType["OTHER"] = "other";
})(DiscrepancyType || (exports.DiscrepancyType = DiscrepancyType = {}));
var ResolutionAction;
(function (ResolutionAction) {
    ResolutionAction["ADJUST_PAYMENT"] = "adjust_payment";
    ResolutionAction["REFUND"] = "refund";
    ResolutionAction["WRITE_OFF"] = "write_off";
    ResolutionAction["CONTACT_PROVIDER"] = "contact_provider";
    ResolutionAction["NONE"] = "none";
})(ResolutionAction || (exports.ResolutionAction = ResolutionAction = {}));
class ReconciliationEntity {
    constructor(data) {
        Object.assign(this, data);
        this.createdAt = this.createdAt || new Date();
        this.updatedAt = new Date();
    }
    /**
     * Check if reconciliation is matched
     */
    isMatched() {
        return this.reconciliationStatus === ReconciliationStatus.MATCHED;
    }
    /**
     * Check if there's a discrepancy
     */
    hasDiscrepancy() {
        return this.reconciliationStatus === ReconciliationStatus.MISMATCH;
    }
    /**
     * Check if resolved
     */
    isResolved() {
        return this.reconciliationStatus === ReconciliationStatus.RESOLVED;
    }
    /**
     * Mark as matched
     */
    markAsMatched() {
        this.reconciliationStatus = ReconciliationStatus.MATCHED;
        this.updatedAt = new Date();
    }
    /**
     * Mark as mismatch
     */
    markAsMismatch(amountDifference, discrepancyType, reason) {
        this.reconciliationStatus = ReconciliationStatus.MISMATCH;
        this.amountDifference = amountDifference;
        this.discrepancyType = discrepancyType;
        this.discrepancyReason = reason;
        this.updatedAt = new Date();
    }
    /**
     * Mark as resolved
     */
    markAsResolved(resolvedBy, action, notes) {
        this.reconciliationStatus = ReconciliationStatus.RESOLVED;
        this.resolvedBy = resolvedBy;
        this.resolvedAt = new Date();
        this.resolutionAction = action;
        this.resolutionNotes = notes;
        this.updatedAt = new Date();
    }
}
exports.ReconciliationEntity = ReconciliationEntity;
exports.default = ReconciliationEntity;
//# sourceMappingURL=reconciliation.entity.js.map