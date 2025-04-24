import React from "react";
import "../css/createList.css";

const AlertModal = ({isOpen, onClose, message}) => {
    if (!isOpen) return null;

    return(
        <div className="modal-overlay">
            <div className="modal-box">
                <button className="modal-close" onClick={onClose}>×</button>
                <p>{message}</p>
            </div>
            </div>
    );
};

export default AlertModal;