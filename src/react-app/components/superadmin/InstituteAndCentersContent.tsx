import React from 'react';
import InstituteContent from './InstituteContent';
import CentersContent from './CentersContent';

const InstituteAndCentersContent = () => {
    return (
        <div className="space-y-8">
            <InstituteContent />
            <div className="border-t border-slate-200 pt-8">
                <CentersContent />
            </div>
        </div>
    );
};

export default InstituteAndCentersContent;
