from pyteal import *

def approval_program():
    handle_creation = Seq([
        App.globalPut(Bytes("Goal"),  Btoi(Txn.application_args[0])),
        App.globalPut(Bytes("FundRaiseStart"), Btoi(Txn.application_args[1])),
        App.globalPut(Bytes("FundRaiseEnd"), Btoi(Txn.application_args[2])),
        App.globalPut(Bytes("TotalBalance"), Int(0)),
        App.globalPut(Bytes("Creator"), Txn.sender()),
        Return(Int(1))
    ])
    is_creator = Txn.sender() == App.globalGet(Bytes("Creator"))
    handle_optin = Return(Int(1))
    handle_closeout = Return(Int(0))
    handle_updateapp = Return(Int(0))
    handle_deleteapp = Return(Int(0))
    globalDonateAmt = ScratchVar(TealType.uint64)
    localDonateAmt = ScratchVar(TealType.uint64)

    current_timestamp = Global.latest_timestamp()
    start_date = App.globalGet(Bytes("FundRaiseStart"))
    end_date = App.globalGet(Bytes("FundRaiseEnd"))
    total_balance = App.globalGet(Bytes("TotalBalance"))
    goal = App.globalGet(Bytes("Goal"))

    on_fundraising = And(
        And(current_timestamp <= end_date, current_timestamp >= start_date),
        (total_balance < goal)
    )

    donate = Seq([
        Assert(on_fundraising),
        Assert(Gtxn[1].receiver() == Global.current_application_address()),
        globalDonateAmt.store(App.globalGet(Bytes("TotalBalance"))),
        localDonateAmt.store(App.localGet(Txn.sender(), Bytes("TotalBalance"))),
        App.localPut(Gtxn[0].sender(), Bytes("TotalBalance"), localDonateAmt.load() + Gtxn[1].amount()),
        App.globalPut(Bytes("TotalBalance"), globalDonateAmt.load() + Gtxn[1].amount()),
        Return(Int(1))
    ])

    withdrawAll = Seq([
        Assert(is_creator),
        Assert(Not(on_fundraising)),
        InnerTxnBuilder.Execute({ #innertxnbuider is the transaction send by the smart contract
            TxnField.type_enum: TxnType.Payment,
            TxnField.close_remainder_to: App.globalGet(Bytes("Creator")),
        }),
        Return(Int(1))
    ])

    update_end_date = Seq([
        Assert(is_creator),
        App.globalPut(Bytes("FundRaiseEnd"), Btoi(Txn.application_args[1])),
        Return(Int(1))
    ])

    update_start_date = Seq([
        Assert(is_creator),
        App.globalPut(Bytes("FundRaiseStart"), Btoi(Txn.application_args[1])),
        Return(Int(1))
    ])

    update_goal = Seq([
        Assert(is_creator),
        App.globalPut(Bytes("Goal"), Btoi(Txn.application_args[1])),
        Return(Int(1))
    ])

    handle_noop = Seq(
        Cond(
            [Txn.application_args[0] == Bytes("donate"), donate],
            [Txn.application_args[0] == Bytes("withdrawAll"), withdrawAll],
            [Txn.application_args[0] == Bytes("update_end_date"), update_end_date],
            [Txn.application_args[0] == Bytes("update_start_date"), update_start_date],
            [Txn.application_args[0] == Bytes("update_goal"), update_goal]
        )
    )

    program = Cond(
        [Txn.application_id() == Int(0), handle_creation],
        [Txn.on_completion() == OnComplete.OptIn, handle_optin],
        [Txn.on_completion() == OnComplete.CloseOut, handle_closeout],
        [Txn.on_completion() == OnComplete.UpdateApplication, handle_updateapp],
        [Txn.on_completion() == OnComplete.DeleteApplication, handle_deleteapp],
        [Txn.on_completion() == OnComplete.NoOp, handle_noop]
    )

    return compileTeal(program, Mode.Application, version=5)

def clear_state_program():
    program = Return(Int(1))
    return compileTeal(program, Mode.Application, version=5)

# Write to file
appFile = open('approval.teal', 'w')
appFile.write(approval_program())
appFile.close()

clearFile = open('clear.teal', 'w')
clearFile.write(clear_state_program())
clearFile.close()
