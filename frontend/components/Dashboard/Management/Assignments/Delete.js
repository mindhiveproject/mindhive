import { useMutation } from "@apollo/client";
import { useRouter } from "next/router";

import { GET_TEMPLATE_ASSIGNMENTS } from "../../../Queries/Assignment";

import { DELETE_ASSIGNMENT } from "../../../Mutations/Assignment";

export default function DeleteAssignment({ children, id }) {
    const router = useRouter();

    const [ deleteAssignment, { data, loading, error} ] = useMutation(DELETE_ASSIGNMENT, {
        variables: {
            id
        },
        refetchQueries: [{ query: GET_TEMPLATE_ASSIGNMENTS }]
    })

    return (
        <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
                if (
                    confirm(
                        'Are you sure you want to delete this assignment template?'
                    )
                ) {
                    deleteAssignment().catch(err => {
                         alert(err.message);
                     });
                    router.push({
                        pathname: `/dashboard/management/assignments`,
                    });
                 }
                }}
            >
            {children}
        </div>
    )

}