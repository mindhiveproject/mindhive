import Link from "next/link";

import TaskCard from "./TaskCard";

export default function UserPath({ query, user, study, isDashboard, path }) {

    // pass the guest publicId to the task page if the user type is guest
    const taskQuery = user?.type === "GUEST" ? 
     { 
        // id: study.id,
        name: study.slug,
        guest: user?.publicId,
     } :
     {
        // id: study.id,
        name: study.slug,
     }

    console.log({ path });
    console.log({ study });
    // check whether there are tasks left in the study
    const nextTaskId = path[path?.length - 1]?.componentID;
    
    // const areTasksLeft = true;
    // const { flow } = study;

    // const findCurrentStep = ({ flow }) => {
    //     console.log({ flow });
    //     const isInFlow = flow?.map(step => step?.id)?.includes(latestUserStepId);
    //     console.log({ isInFlow });
    //     if(!flow || flow?.length === 0) {
    //         return false;
    //     }
    //     if(isInFlow) {
    //         return flow;
    //     } else {
    //         const [conditions] = flow?.filter(step => step?.type === "design")
    //             .map(step => step?.conditions);
    //         let returnValue;
    //         if(conditions?.length) {
    //             for (let i = 0; i < conditions.length; i++) {
    //                 if(findCurrentStep({ flow: conditions[i]?.flow })) {
    //                     returnValue = findCurrentStep({ flow: conditions[i]?.flow });
    //                 }
    //             }
    //             return returnValue;
    //         }
    //     } 
    // }

    // const nextStep = findCurrentStep({ flow });
    // console.log({ nextStep });

    return (
        <div>
            {user?.type === "GUEST" && 
                <div>
                    <p>
                        You participate as a guest.
                    </p>
                </div>
            }
            
            {path
                .filter((step) => step?.type === "task")
                .map((step, num) => (
                    <TaskCard key={num} step={step} user={user} study={study} />
            ))}

            {(path.length === 0 ||  nextTaskId) && 
                <Link
                    href={{
                        pathname: `/participate/run`,
                        query: taskQuery,
                    }}
                >
                    <div className="controlBtns">
                        <button>Start the next task</button>
                    </div>
                </Link>         
            }
        </div>
    )

}